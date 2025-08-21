import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

type Warehouse = { id:number; name:string; capacity_pl:number|null; order_index:number|null }

export default function Masters() {
  const [rows, setRows] = useState<Warehouse[]>([])
  const [cap, setCap] = useState<Record<number,string>>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null>(null)

  const nav = useNavigate()

  // ★ セッション取得＆監視（既存の仕組みがあればそれに合わせてもOK）
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // 取得
  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id,name,capacity_pl,order_index')
        .order('order_index', { ascending: true })
      if (error) throw error
      setRows(data ?? [])
      const init: Record<number,string> = {}
      for (const r of data ?? []) init[r.id] = String(r.capacity_pl ?? 0)
      setCap(init)
    } catch (e:any) {
      setMsg(`取得失敗: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchData() }, [])

  // 更新（RLSがauth限定なので未ログインだと自然に失敗＝0件になります）
  const updateCapacity = async (id:number) => {
    setMsg('')
    if (!session) { setMsg('更新にはログインが必要です'); return }
    const next = Number(cap[id] ?? 0)
    const { error } = await supabase
      .from('warehouses')
      .update({ capacity_pl: next })
      .eq('id', id)
    if (error) { setMsg(`更新失敗: ${error.message}`); return }
    await fetchData()
    setMsg('更新しました')
    supabase.channel('inventory-sync').send({ type:'broadcast', event:'masters-updated', payload:{ id, capacity_pl: next } })
  }

  if (loading) return <div style={{ padding:16 }}>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ margin:0 }}>マスタ設定</h1>
        <Link to="/dashboard">ダッシュボードへ戻る</Link>
      </div>

      {!session && (
        <div style={{ margin:'12px 0', padding:12, border:'1px solid #ccc', borderRadius:8, background:'#fffbea' }}>
          <div style={{ marginBottom:8 }}>更新にはログインが必要です。</div>
          <button onClick={() => nav('/login')}>ログインへ</button>{/* ← 既存のログイン画面のパスに合わせる */}
        </div>
      )}

      {msg && <div style={{ margin:'8px 0', color: msg.startsWith('更新失敗') ? 'crimson' : 'seagreen' }}>{msg}</div>}

      <table style={{ borderCollapse:'collapse', minWidth:720, opacity: session ? 1 : 0.6 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left', padding:8 }}>倉庫名</th>
            <th style={{ textAlign:'right', padding:8, width:160 }}>PL容量</th>
            <th style={{ padding:8, width:120 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(w => (
            <tr key={w.id}>
              <td style={{ padding:8 }}>{w.name}</td>
              <td style={{ padding:8, textAlign:'right' }}>
                <input
                  type="number"
                  value={cap[w.id] ?? ''}
                  onChange={e => setCap(p => ({...p, [w.id]: e.target.value}))}
                  style={{ width:120, textAlign:'right' }}
                  disabled={!session}
                />
              </td>
              <td style={{ padding:8 }}>
                <button onClick={() => updateCapacity(w.id)} disabled={!session}>更新</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

