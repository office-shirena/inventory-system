// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import WarehouseCard from '../components/WarehouseCard'
import { ShipOutModal } from '../components/ShipOutModal'
import { ProduceModal } from '../components/ProduceModal'

export default function Dashboard() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [shipOpen, setShipOpen] = useState(false)
  const [shipCtx, setShipCtx] = useState<any>(null)
  const [prodOpen, setProdOpen] = useState(false)
  const [prodWhId, setProdWhId] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id,name,order_index')
        .order('order_index')
      if (error) console.error(error)
      setWarehouses(data ?? [])
    })()
  }, [])

  const tianjin = useMemo(() => warehouses.find((w: any) => w.name === '天津'), [warehouses])
  const rohto   = useMemo(() => warehouses.find((w: any) => w.name === 'ロート'), [warehouses])
  const qtp     = useMemo(() => warehouses.find((w: any) => w.name === 'QTP'),   [warehouses])

  const onLotClick = (wh: any) => (row: any) => {
    setShipCtx({
      warehouseId: wh.id,
      warehouseName: wh.name,
      itemId: row.itemId,
      itemName: row.itemName,
      lotCode: row.lotCode,
      currentQty: row.qty,
    })
    setShipOpen(true)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const openProduce = () => {
    if (!tianjin) return alert('天津倉庫が見つかりません')
    setProdWhId(tianjin.id)
    setProdOpen(true)
  }

  const onAfterAction = (action: 'reload' | 'refresh') => {
    if (action === 'reload') window.location.reload()
    else setReloadKey(k => k + 1)
  }

  return (
    <div className="container">
      <div className="header">
        <h2>ダッシュボード</h2>
        <div className="nav">
          <a href="/dashboard">Dashboard</a>
          <a href="/history">履歴</a>
          <a href="/masters">マスタ</a>
          <button className="button" onClick={openProduce}>生産</button>
          <button className="button" onClick={signOut}>サインアウト</button>
        </div>
      </div>

      <div className="grid grid-3">
        {tianjin && (
          <WarehouseCard
            warehouseId={tianjin.id}
            warehouseName="天津"
            onLotClick={onLotClick(tianjin)}
            reloadKey={reloadKey}
          />
        )}
        {rohto && (
          <WarehouseCard
            warehouseId={rohto.id}
            warehouseName="ロート"
            onLotClick={onLotClick(rohto)}
            reloadKey={reloadKey}
          />
        )}
        {qtp && (
          <WarehouseCard
            warehouseId={qtp.id}
            warehouseName="QTP"
            onLotClick={onLotClick(qtp)}
            reloadKey={reloadKey}
          />
        )}
      </div>

      <ShipOutModal open={shipOpen} onClose={() => setShipOpen(false)} ctx={shipCtx} onDone={onAfterAction} />
      <ProduceModal open={prodOpen} onClose={() => setProdOpen(false)} warehouseId={prodWhId} defaultWarehouseName="天津" onDone={onAfterAction} />
    </div>
  )
}

