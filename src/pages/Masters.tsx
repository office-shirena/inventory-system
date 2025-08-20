// src/pages/Masters.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Masters() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState('')

  const load = async () => {
    const { data: ws } = await supabase.from('warehouses').select('id,name,capacity_pl,order_index').order('order_index')
    setWarehouses(ws ?? [])
    const { data: its } = await supabase.from('items').select('id,name').order('name')
    setItems(its ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const saveCap = async (w: any, capPl: number) => {
    await supabase.from('warehouses').update({ capacity_pl: capPl }).eq('id', w.id)
    await load()
  }

  const addItem = async () => {
    if (!newItem.trim()) return
    await supabase.from('items').insert({ name: newItem.trim() })
    setNewItem('')
    await load()
  }

  const delItem = async (id: number) => {
    if (!confirm('削除しますか？')) return
    // 依存がある場合はDB側で制約エラーになります。必要ならソフトデリートに変更。
    await supabase.from('items').delete().eq('id', id)
    await load()
  }

  return (
    <div className="container">
      <div className="header">
        <h2>マスタ管理</h2>
        <div className="nav">
          <a href="/dashboard">← ダッシュボード</a>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3>倉庫（容量：PL）</h3>
          <table className="table">
            <thead>
              <tr>
                <th>倉庫名</th>
                <th>容量(PL)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      defaultValue={w.capacity_pl ?? 0}
                      onBlur={(e) => saveCap(w, Number(e.target.value))}
                    />
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>品目</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input" placeholder="新規品目名" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <button className="button" onClick={addItem}>
              追加
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>品目名</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>{i.name}</td>
                  <td>
                    <button className="button" onClick={() => delItem(i.id)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={2}>品目がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
