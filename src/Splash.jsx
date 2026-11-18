import { useEffect, useState } from 'react'
const seen = () => { try { return sessionStorage.getItem('fx-splash') } catch { return null } }
export default function Splash({ children }) {
  const [phase, setPhase] = useState(seen() ? 'done' : 'show')
  useEffect(() => {
    if (phase !== 'show') return
    const a = setTimeout(() => setPhase('out'), 1900)
    const b = setTimeout(() => { setPhase('done'); try { sessionStorage.setItem('fx-splash', '1') } catch { } }, 2600)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [phase])
  return <>{children}{phase !== 'done' && <div className={`splash ${phase}`} role="status" aria-label="Loading FIXORA">
    <div className="splash-in"><span className="logo big">Fix<i>ora</i></span><div className="bar"><span /></div><small>Maintenance made simple</small></div></div>}</>
}
