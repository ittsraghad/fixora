import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

const HOME = { admin: '/admin', technician: '/tech', resident: '/app' }
const friendly = m => /fetch|network/i.test(m) ? 'Cannot reach the server. Please check your connection.' : m

function Frame({ title, sub, children }) {
  return <div className="authpage"><header className="authhead"><Link className="logo" to="/">Fix<i>ora</i></Link><span className="crumb">Maintenance management system</span></header>
    <div className="authcard"><h1>{title}</h1><p className="sub">{sub}</p>{children}</div></div>
}

function Pw({ label = 'Password', value, onChange, ...p }) {
  const [show, setShow] = useState(false)
  return <><label>{label}</label><div className="pw"><input type={show ? 'text' : 'password'} required value={value} onChange={onChange} {...p} />
    <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></>
}

export function Login() {
  const [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const { session, profile } = useAuth(), set = k => e => setF({ ...f, [k]: e.target.value })
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        setErr('')
        setInfo('')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function go(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.signInWithPassword(f)
    if (error) {
      setBusy(false)
      setErr(friendly(error.message))
    }
  }

  async function forgot() {
    if (!f.email) return setErr('Enter your email first.')
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.resetPasswordForEmail(f.email, {
      redirectTo: window.location.origin + '/login'
    })
    setBusy(false)
    error ? setErr(friendly(error.message)) : setInfo('Check your inbox for a reset link.')
  }

  async function updatePassword(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { error } = await supabase.auth.updateUser({ password: f.password })
    setBusy(false)
    if (error) return setErr(friendly(error.message))
    setRecovery(false)
    setInfo('Password updated successfully. You can now log in.')
    setF({ ...f, password: '' })
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (session && profile && !recovery) return <Navigate to={HOME[profile.role]} replace />

  if (recovery) return <Frame title="Reset password" sub="Choose a new password for your account.">
    <form onSubmit={updatePassword}>
      <Pw value={f.password} onChange={set('password')} minLength={6} placeholder="New password" autoComplete="new-password" />
      {err && <p className="err">{err}</p>}
      {info && <p className="msg">{info}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    </form>
  </Frame>

  return <Frame title="Welcome back" sub="Log in to follow your maintenance requests.">
    <form onSubmit={go}><label>Email</label><input type="email" required autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} />
      <Pw value={f.password} onChange={set('password')} placeholder="Enter your password" autoComplete="current-password" />
      <div className="forgot"><button type="button" className="linkbtn" onClick={forgot} disabled={busy}>Forgot password?</button></div>
      {err && <p className="err">{err}</p>}{info && <p className="msg">{info}</p>}
      <button className="btn full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button></form>
    <p className="alt">New to Fixora? <Link to="/signup">Create an account</Link></p></Frame>
}

export function Signup() {
  const [f, setF] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const { session, profile } = useAuth(), set = k => e => setF({ ...f, [k]: e.target.value })
  async function go(e) {
    e.preventDefault(); setErr(''); if (f.password !== f.confirm) return setErr('Passwords do not match.')
    setBusy(true); const { error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name, phone: f.phone } } })
    if (error) { setBusy(false); setErr(friendly(error.message)) }
  }
  if (session && profile) return <Navigate to={HOME[profile.role]} replace />
  return <Frame title="Create account" sub="Set up your account to start sending maintenance requests.">
    <form onSubmit={go}><label>Full name</label><input required placeholder="Your full name" value={f.full_name} onChange={set('full_name')} />
      <label>Email</label><input type="email" required placeholder="you@example.com" value={f.email} onChange={set('email')} />
      <label>Phone number</label><input placeholder="05XXXXXXXX" value={f.phone} onChange={set('phone')} />
      <Pw value={f.password} onChange={set('password')} minLength={6} placeholder="At least 6 characters" autoComplete="new-password" />
      <Pw label="Confirm password" value={f.confirm} onChange={set('confirm')} placeholder="Repeat your password" autoComplete="new-password" />
      {err && <p className="err">{err}</p>}<button className="btn full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button></form>
    <p className="alt">Already registered? <Link to="/login">Log in</Link></p></Frame>
}