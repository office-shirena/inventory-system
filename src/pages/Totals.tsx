// src/pages/Totals.tsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

type Row = { item_id: number; item_name: string; total_kg: number; in_kg: number; out_kg: number }

export default function Totals() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    // lots 合計で「残在庫」を算出／履歴から入出庫合計も計算
    const { data: lots } = await supabase.from('lots').select('item_id,qty_kg')
    const { data: items } = await supabase.from('items').select('id,name')
    const { data: hist } = await supabase.from('history').select('item_id,in_kg,out_kg')

    const nameMap = new Map<number, string>((items ?? []).map((i: any) => [i.id, i.name]))
    const totalMap = new Map<number, number>()
    ;(lots ?? []).forEach((l: any) => totalMap.set(l.item_id, (totalMap.get(l.item_id) ?? 0) + (l.qty_kg ?? 0)))

    const inMap = new Map<number, number>()
    const outMap = new Map<number, number>()
    ;(hist ?? []).forEach((h: any) => {
      inMap.set(h.item_id, (inMap.get(h.item_id) ?? 0) + (h.in_kg ?? 0))
      outMap.set(h.item_id, (outMap.get(h.item_id) ?? 0) + (h.out_kg ?? 0))
    })

    const ids = new Set<number>([...totalMap.keys(), ...inMap.keys(), ...outMap.keys()])
    const list: Row[] = [...ids].map((id) => ({
      item_id: id,
      item_name: nameMap.get(id) ?? '',
      total_kg: totalMap.get(id) ?? 0,
      in_kg: inMap.get(id) ?? 0,
      out_kg: outMap.get(id) ?? 0,
    }))
    setRows(list.sort((a, b) => a.item_name.localeCompare(b.item_name)))
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const grand = useMemo(
    () => rows.reduce((s, r) => s + r.total_kg, 0),
    [rows],
  )

  return (
    <div className="container">
      <div className="header">
        <h2>総数管理</h2>
        <div className="nav">
          <a href="/dashboard">← ダッシュボード</a>
          <button className="button" onClick={fetchData} disabled={loading}>
            再集計
          </button>
        </div>
      </div>
      <div className="card">
        <table className="table kg">
          <thead>
            <tr>
              <th>品目名</th>
              <th style={{ textAlign: 'right' }}>入庫(kg)</th>
              <th style={{ textAlign: 'right' }}>出庫(kg)</th>
              <th style={{ textAlign: 'right' }}>残在庫(kg)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item_id}>
                <td>{r.item_name}</td>
                <td style={{ textAlign: 'right' }}>{r.in_kg}</td>
                <td style={{ textAlign: 'right' }}>{r.out_kg}</td>
                <td style={{ textAlign: 'right' }}>{r.total_kg}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>データがありません</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th>合計</th>
              <th></th>
              <th></th>
              <th style={{ textAlign: 'right' }}>{grand}</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
