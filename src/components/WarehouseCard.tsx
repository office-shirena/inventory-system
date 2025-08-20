// src/components/WarehouseCard.tsx
import { useEffect, useState, Fragment } from 'react'
import { supabase } from '../supabaseClient'

type LotRow = {
  lot_code: string
  qty_kg: number
  item_id: number
  item_name: string
  memo?: string
}

export default function WarehouseCard({
  warehouseId,
  warehouseName,
  onLotClick,
  reloadKey,
}: {
  warehouseId: number
  warehouseName: string
  onLotClick: (row: { itemId: number; itemName: string; lotCode: string; qty: number }) => void
  reloadKey: number
}) {
  const [total, setTotal] = useState<number>(0)
  const [freeKg, setFreeKg] = useState<number>(0)
  const [capPl, setCapPl] = useState<number>(0)
  const [lots, setLots] = useState<LotRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // メモ編集用
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>('')

  const PL = 400

  async function fetchAll() {
    setLoading(true)
    try {
      // 倉庫容量（PL）
      const { data: w, error: werr } = await supabase
        .from('warehouses')
        .select('id,capacity_pl')
        .eq('id', warehouseId)
        .maybeSingle()
      if (werr) throw werr
      const capPlVal = (w?.capacity_pl as number) ?? 0
      const capKg = capPlVal * PL
      setCapPl(capPlVal)

      // --- 全倉庫のロット合計を計算（item_id+lot_code 単位） ---
      const { data: allLots, error: aerr } = await supabase
        .from('lots')
        .select('item_id,lot_code,qty_kg') // 軽量取得
      if (aerr) throw aerr

      const globalSum = new Map<string, number>()
      for (const r of allLots ?? []) {
        const key = `${r.item_id}|${(r.lot_code ?? '').trim()}`
        const prev = globalSum.get(key) ?? 0
        globalSum.set(key, prev + (Number(r.qty_kg) || 0))
      }

      // この倉庫の lots（memo を含めて取得）
      const { data: lrows, error: lerr } = await supabase
        .from('lots')
        .select('lot_code,qty_kg,item_id,memo')
        .eq('warehouse_id', warehouseId)
        .order('lot_code')
      if (lerr) throw lerr

      const rawList =
        (lrows ?? []).map((l: any) => ({
          lot_code: (l.lot_code ?? '').trim(),
          qty_kg: Number(l.qty_kg) || 0,
          item_id: Number(l.item_id),
          memo: l.memo ?? '',
        })) ?? []

      // ★ フィルタ：全倉庫合計が 0kg のロットは除外 ★
      const filteredList = rawList.filter((l) => {
        const key = `${l.item_id}|${l.lot_code}`
        return (globalSum.get(key) ?? 0) > 0
      })

      // 表示用：品目名を付与
      let nameMap = new Map<number, string>()
      if (filteredList.length > 0) {
        const ids = [...new Set(filteredList.map((l) => l.item_id))]
        if (ids.length > 0) {
          const { data: items, error: ierr } = await supabase.from('items').select('id,name').in('id', ids)
          if (ierr) throw ierr
          nameMap = new Map<number, string>((items ?? []).map((i: any) => [Number(i.id), i.name]))
        }
      }

      const viewList: LotRow[] = filteredList.map((l) => ({
        lot_code: l.lot_code,
        qty_kg: l.qty_kg,
        item_id: l.item_id,
        item_name: nameMap.get(l.item_id) ?? '',
        memo: l.memo,
      }))

      // この倉庫の総在庫/残容量は「この倉庫の在庫総量」で計算（フィルタ前の合計）
      const sumThisWarehouse = rawList.reduce((s, l) => s + l.qty_kg, 0)
      setTotal(sumThisWarehouse)
      setFreeKg(Math.max(capKg - sumThisWarehouse, 0))

      setLots(viewList)
    } catch (e: any) {
      console.error(e)
      alert(`在庫の取得に失敗しました：${e?.message ?? e}`)
      setLots([])
      setTotal(0)
      setFreeKg(0)
      setCapPl(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, reloadKey])

  // メモ編集開始
  function startEdit(itemId: number, lotCode: string, cur: string) {
    setEditingKey(`${itemId}|${(lotCode ?? '').trim()}`)
    setEditingText(cur ?? '')
  }

  // メモ保存（更新件数チェック＋再取得）
  async function saveMemo(itemId: number, lotCode: string) {
    const code = (lotCode ?? '').trim()
    const { data, error } = await supabase
      .from('lots')
      .update({ memo: editingText })
      .eq('warehouse_id', warehouseId)
      .eq('item_id', itemId)
      .eq('lot_code', code)
      .select('warehouse_id,item_id,lot_code,memo')
      .limit(1)

    if (error) return alert(error.message)
    if (!data || data.length === 0) {
      return alert('メモの更新対象が見つかりません（倉庫/品目/ロットの一致や権限を確認）')
    }
    setEditingKey(null)
    setEditingText('')
    await fetchAll() // 保存後は必ず再取得
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3>{warehouseName}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge">総在庫 {total} kg</span>
          <span className="badge">残容量 {Math.floor(freeKg / PL)} PL ({freeKg} kg)</span>
          <span className="badge">容量 {capPl} PL</span>
        </div>
      </div>

      <table className="table kg">
        <thead>
          <tr>
            <th>品目</th>
            <th>ロット</th>
            <th style={{ textAlign: 'right' }}>数量(kg)</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((l) => {
            const rowKey = `${l.item_id}|${l.lot_code}`
            const isEditing = editingKey === rowKey
            return (
              <Fragment key={rowKey}>
                <tr>
                  <td>{l.item_name || '-'}</td>
                  <td>
                    <button
                      className="button"
                      onClick={() =>
                        onLotClick({
                          itemId: l.item_id,
                          itemName: l.item_name,
                          lotCode: l.lot_code,
                          qty: l.qty_kg,
                        })
                      }
                      disabled={loading}
                    >
                      {l.lot_code}
                    </button>

                    {/* メモ表示＆編集 */}
                    <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                      {!isEditing ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span>メモ：{l.memo || '（なし）'}</span>
                          <button className="button" onClick={() => startEdit(l.item_id, l.lot_code, l.memo ?? '')}>
                            編集
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            className="input"
                            style={{ maxWidth: 360 }}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            placeholder="メモを入力"
                          />
                          <button className="button" onClick={() => saveMemo(l.item_id, l.lot_code)}>
                            保存
                          </button>
                          <button
                            className="button"
                            onClick={() => {
                              setEditingKey(null)
                              setEditingText('')
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top' }}>{l.qty_kg}</td>
                </tr>
              </Fragment>
            )
          })}
          {lots.length === 0 && (
            <tr>
              <td colSpan={3}>{loading ? '読み込み中…' : 'ロットがありません'}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}


