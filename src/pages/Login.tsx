
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login(){
  const nav=useNavigate(); const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const signIn=async()=>{ const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) alert(error.message); else nav('/dashboard') }
  const signUp=async()=>{ const {error}=await supabase.auth.signUp({email,password}); if(error) alert(error.message); else alert('確認メールをチェックしてください') }
  return (<div className="container"><div className="card" style={{maxWidth:480,margin:'48px auto'}}>
    <h1>サインイン</h1>
    <label>メール</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <label>パスワード</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
    <div style={{display:'flex',gap:8,marginTop:12}}><button className="button" onClick={signIn}>ログイン</button><button className="button" onClick={signUp}>サインアップ</button></div>
  </div></div>)
}
