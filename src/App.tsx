// src/App.tsx
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Totals from './pages/Totals'
import Masters from './pages/Masters'
import { supabase } from './supabase'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<any>(null)
  const loc = useLocation()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])
  if (!ready) return null
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" state={{ from: loc }} />} />
      <Route path="/history" element={user ? <History /> : <Navigate to="/" />} />
      <Route path="/totals" element={user ? <Totals /> : <Navigate to="/" />} />
      <Route path="/masters" element={user ? <Masters /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
