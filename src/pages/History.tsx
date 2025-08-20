// src/pages/History.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

type Row = {
  id: number;
  date: string | null;         // ← historyにある日付列
  warehouse_id: number;
  item_id: number;
  lot_code: string;
  in_kg: number | null;
  out_kg: number | null;
  qty_kg: number | null;
  reason: string | null;
  memo: string | null;
};

export default function History() {
  const [rows, setRows] = useState<Row[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [wFilter, setWFilter] = useState<number | "all">("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: ws }, { data: its }] = await Promise.all([
        supabase.from("warehouses").select("id,name").order("order_index"),
        supabase.from("items").select("id,name").order("name"),
      ]);
      setWarehouses(ws ?? []);
      setItems(its ?? []);
      fetchRows(); // 初期に必ず表示
    })();
  }, []);

  async function fetchRows() {
    setLoading(true);
    setErrorText("");

    let q = supabase
      .from("history")
      .select("id,date,warehouse_id,item_id,lot_code,in_kg,out_kg,qty_kg,reason,memo")
      .order("id", { ascending: false })
      .limit(500);

    if (wFilter !== "all") q = q.eq("warehouse_id", wFilter as number);
    if (from) q = q.gte("date", from);
    if (to) q = q.lte("date", to);

    const { data, error } = await q;
    if (error) {
      setErrorText(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  }

  const mW = useMemo(() => new Map(warehouses.map((w) => [w.id, w.name])), [warehouses]);
  const mI = useMemo(() => new Map(items.map((i) => [i.id, i.name])), [items]);

  return (
    <div className="container">
      <div className="header">
        <h2>履歴</h2>
        <div className="nav">
          <a href="/dashboard">← ダッシュボード</a>
          <button className="button" onClick={fetchRows} disabled={loading}>
            {loading ? "検索中..." : "検索"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row">
          <div>倉庫</div>
          <select className="select" value={wFilter} onChange={(e) => setWFilter((e.target.value as any) === "all" ? "all" : Number(e.target.value))}>
            <option value="all">すべて</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="row">
          <div>期間</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {errorText && <div style={{ color: "#b91c1c", marginTop: 8 }}>エラー: {errorText}</div>}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <table className="table kg">
          <thead>
            <tr>
              <th>取引日</th>
              <th>倉庫</th>
              <th>品目</th>
              <th>ロット</th>
              <th style={{ textAlign: "right" }}>入庫(kg)</th>
              <th style={{ textAlign: "right" }}>出庫(kg)</th>
              <th>理由</th>
              <th>メモ</th>
              <th style={{ textAlign: "right" }}>数量(kg)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.date ?? ""}</td>
                <td>{mW.get(r.warehouse_id) ?? ""}</td>
                <td>{mI.get(r.item_id) ?? ""}</td>
                <td>{r.lot_code}</td>
                <td style={{ textAlign: "right" }}>{r.in_kg ?? 0}</td>
                <td style={{ textAlign: "right" }}>{r.out_kg ?? 0}</td>
                <td>{r.reason ?? ""}</td>
                <td>{r.memo ?? ""}</td>
                <td style={{ textAlign: "right" }}>{r.qty_kg ?? 0}</td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={9} style={{ color: "#6b7280" }}>データがありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
