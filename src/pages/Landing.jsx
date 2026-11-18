import { Link } from 'react-router-dom'
import { Wrench, Activity, Users, History } from 'lucide-react'
const F = [[Wrench, 'Easy requests', 'Describe the problem, add photos, and send it in under a minute.'], [Activity, 'Live tracking', 'See exactly where your request stands, updated as it happens.'], [Users, 'Team management', 'Assign the right technician and keep workloads balanced.'], [History, 'Service history', 'Every repair is recorded, so nothing gets lost.']]
const STEPS = [['Submit a request', 'Tell us what is wrong and where.'], ['Review and assign', 'An admin checks it and picks a technician.'], ['Fix the problem', 'The technician works and shares photos.'], ['Confirm resolution', 'You approve the fix and rate the service.']]
const ROLES = [['Residents', ['Report problems with photos', 'Track every status change', 'Message the team', 'Rate the service']], ['Admins', ['See all requests in one table', 'Assign technicians', 'Reports and CSV export', 'Manage the maintenance team']], ['Technicians', ['A focused list of your tasks', 'Update work status', 'Upload completion photos', 'Full work history']]]
export default function Landing() {
  return <>
    <nav className="sticky"><div className="wrap"><span className="logo">Fix<i>ora</i></span>
      <div className="links"><a href="#features">Features</a><a href="#how">How it works</a><a href="#roles">Who it is for</a></div>
      <span style={{ display: 'flex', gap: '.6rem' }}><Link className="btn ghost" to="/login">Log in</Link><Link className="btn" to="/signup">Get started</Link></span></div></nav>
    <div className="wrap"><div className="hero"><div><span className="pill">Maintenance management</span><h1>Maintenance made simple. Solutions made faster.</h1>
      <p>Report a problem, follow the repair, and stay connected with your maintenance team in one calm place.</p>
      <div style={{ display: 'flex', gap: '.7rem', marginTop: '1.6rem', flexWrap: 'wrap' }}><Link className="btn teal" to="/signup">Report a problem</Link><a className="btn ghost" href="#how">See how it works</a></div></div>
      <div className="art"><div className="mini"><span><b>Kitchen water leakage</b><br/><small>FX-2026-00124 · Building A, 204</small></span><span className="badge Progress">In progress</span></div>
        <div className="tl" style={{ margin: '1rem 0' }}>{['Submitted', 'Assigned', 'In progress', 'Resolved'].map((s, i) => <span key={s} className={i < 3 ? 'on' : ''}>{s}</span>)}</div>
        <div className="mini"><span><b>AC stopped working</b><br/><small>FX-2026-00123</small></span><span className="badge Resolved">Resolved</span></div>
        <div className="mini"><span><b>Hallway light flickering</b><br/><small>FX-2026-00122</small></span><span className="badge Submitted">Submitted</span></div></div></div></div>
    <section className="band alt" id="features"><div className="wrap"><h2>Everything in one place</h2><div className="grid4" style={{ marginTop: '1.5rem' }}>{F.map(([I, t, d]) => <div className="feat" key={t}><I color="#16A6A1"/><h3 style={{ fontSize: '1.2rem', marginTop: '.6rem' }}>{t}</h3><p>{d}</p></div>)}</div></div></section>
    <section className="band" id="how"><div className="wrap"><h2>From report to resolved</h2><div className="steps" style={{ marginTop: '1.5rem' }}>{STEPS.map(([t, d]) => <div className="step" key={t}><h3 style={{ fontSize: '1.15rem' }}>{t}</h3><p>{d}</p></div>)}</div></div></section>
    <section className="band alt" id="roles"><div className="wrap"><h2>Built for every role</h2><div className="roles" style={{ marginTop: '1.5rem' }}>{ROLES.map(([t, l]) => <div className="card" key={t}><h3>{t}</h3><ul>{l.map(x => <li key={x}>{x}</li>)}</ul></div>)}</div></div></section>
    <section className="band"><div className="wrap"><div className="cta"><h2>Ready to fix things faster?</h2><p>Create a free account and send your first request today.</p><Link className="btn teal" to="/signup">Get started</Link></div></div></section>
    <footer>© 2026 FIXORA — Smart Maintenance Management</footer></>
}
