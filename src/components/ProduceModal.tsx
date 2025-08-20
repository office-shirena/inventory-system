
import { useState } from 'react'
import { supabase } from '../supabase'
export function ProduceModal({open,onClose,warehouseId,defaultWarehouseName,onDone}:{open:boolean;onClose:()=>void;warehouseId:number|null;defaultWarehouseName:string;onDone:(action:'reload'|'refresh')=>void;}){
  const [itemName,setItemName]=useState('あいう'); const [lotCode,setLotCode]=useState('L001'); const [qty,setQty]=useState<number>(100); const [memo,setMemo]=useState('')
  if(!open||!warehouseId) return null
  const confirm=async()=>{ const { error }=await supabase.rpc('rpc_produce',{p_warehouse_id:warehouseId,p_item_name:itemName,p_lot_code:lotCode,p_qty_kg:qty,p_prev_lot_id:null,p_memo:memo}); if(error) return alert(error.message); onClose(); onDone('reload') }
  return (<div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <h3>生産（入庫）</h3>
    <div className="row"><div>倉庫</div><div>{defaultWarehouseName}</div></div>
    <div className="row"><div>品目名</div><input className="input" value={itemName} onChange={e=>setItemName(e.target.value)} /></div>
    <div className="row"><div>ロット</div><input className="input" value={lotCode} onChange={e=>setLotCode(e.target.value)} /></div>
    <div className="row"><div>数量(kg)</div><input className="input" type="number" value={qty} onChange={e=>setQty(parseFloat(e.target.value))} /></div>
    <div className="row"><div>メモ</div><textarea className="textarea" value={memo} onChange={e=>setMemo(e.target.value)} /></div>
    <div style={{display:'flex',justifyContent:'flex-end',gap:8}}><button className="button" onClick={confirm}>確定</button><button className="button" onClick={onClose}>キャンセル</button></div>
  </div></div>) }
