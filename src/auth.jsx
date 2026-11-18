import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null), [init, setInit] = useState(true), [loadedFor, setLoadedFor] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setInit(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) { setProfile(null); setLoadedFor(null); return }
    let off = false
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => { if (!off) { setProfile(data); setLoadedFor(session.user.id) } })
    return () => { off = true }
  }, [session?.user?.id])
  const loading = init || (!!session && loadedFor !== session.user.id)
  return <Ctx.Provider value={{ session, profile, loading, signOut: () => supabase.auth.signOut() }}>{children}</Ctx.Provider>
}
