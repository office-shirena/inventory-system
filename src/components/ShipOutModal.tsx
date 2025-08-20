
import { useMemo, useState } from 'react'
import { supabase } from '../supabase'
type Ctx={warehouseId:number;warehouseName:string;itemId:number;itemName:string;lotCode:string;currentQty:number}
export function ShipOutModal({open,onClose,ctx,onDone}:{open:boolean;onClose:()=>void;ctx:Ctx|null;onDone:(action:'reload'|'refresh')=>void;}){
  const [qty,setQty]=useState<number>(0); const [memo,setMemo]=useState('')
  const reasonOptions=useMemo(()=>!ctx?[]:(ctx.warehouseName==='QTP'?['抜き取り','製造使用']:['抜き取り','移動']),[ctx?.warehouseName])
  const [reason,setReason]=useState<string>('抜き取り')
  if(!open||!ctx) return null
  const confirm=async()=>{
    if(qty<=0) return alert('出庫数(kg)を入力してください')
    if(qty>ctx.currentQty) return alert('現在数量を超えています')
    if(reason==='移動'){
      const { data:ws }=await supabase.from('warehouses').select('id,order_index').order('order_index')
      const from=ws?.find(w=>w.id===ctx.warehouseId)!; const to=ws?.find(w=>w.order_index===from.order_index+1)
      if(!to) return alert('次工程の倉庫がありません')
      const { error }=await supabase.rpc('rpc_move',{p_from_warehouse_id:ctx.warehouseId,p_item_id:ctx.itemId,p_lot_code:ctx.lotCode,p_move_kg:qty,p_to_warehouse_id:to.id,p_memo:memo})
      if(error) return alert(error.message)
    }else{
      const { error }=await supabase.rpc('rpc_ship_out',{p_warehouse_id:ctx.warehouseId,p_item_id:ctx.itemId,p_lot_code:ctx.lotCode,p_out_kg:qty,p_reason:reason,p_memo:memo})
      if(error) return alert(error.message)
    }
    onClose(); onDone('reload')
  }
  return (<div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <h3>出庫</h3>
    <div className="row"><div>倉庫</div><div>{ctx.warehouseName}</div></div>
    <div className="row"><div>品目</div><div>{ctx.itemName}</div></div>
    <div className="row"><div>ロット</div><div>{ctx.lotCode}</div></div>
    <div className="row"><div>現在数量</div><div className="kg">{ctx.currentQty} kg</div></div>
    <div className="row"><div>出庫数(kg)</div><input className="input" type="number" value={qty} onChange={e=>setQty(parseFloat(e.target.value))}/></div>
    <div className="row"><div>理由</div><select className="select" value={reason} onChange={e=>setReason(e.target.value)}>{reasonOptions.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
    <div className="row"><div>メモ</div><textarea className="textarea" value={memo} onChange={e=>setMemo(e.target.value)} /></div>
    <div style={{display:'flex',justifyContent:'flex-end',gap:8}}><button className="button" onClick={confirm}>確定</button><button className="button" onClick={onClose}>キャンセル</button></div>
  </div></div>) }
