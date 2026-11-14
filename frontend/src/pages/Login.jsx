import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { Icon, Logo, PasswordInput } from '../components/ui'

const STEPS = [
  ['Create your account', 'Just an email and a password. It takes under a minute.'],
  ['Read the instructions', 'See the duration, the number of questions and the rules before you start.'],
  ['Take the timed test', 'One question at a time. Your answers save automatically as you go.'],
]
const INTRO = 'Companies visiting your campus run their aptitude rounds here. Sign in, sit the test, and you are done.'
const CHIPS = [['clock', 'Live timer'], ['shield', 'Auto-save'], ['check', 'One attempt']]

/* ---------------- Right panel: dark green with glass cards ---------------- */
function AuthPanel() {
  return (
    <div
      className="hidden lg:flex lg:h-screen lg:overflow-hidden relative flex-col justify-center text-white px-14 py-8 overflow-hidden"
      style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 1.2px, transparent 1.2px), linear-gradient(135deg, #0f766e, #115e59 55%, #042f2e)', backgroundSize: '22px 22px, auto' }}
    >
      <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-amber-400/15 blur-3xl" />
      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold text-teal-50">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Campus placement tests
        </span>
        <h2 className="mt-4 text-[2.4rem] font-extrabold leading-[1.08] tracking-tight">
          One test.<br /><span className="text-amber-300">A real shot</span><br />at your next job.
        </h2>
        <p className="mt-3 text-teal-50/80 text-[15px] leading-relaxed">{INTRO}</p>
        <ol className="mt-6 space-y-2.5">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="flex items-start gap-4 rounded-2xl bg-white/10 border border-white/15 px-5 py-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-amber-400 text-stone-900 font-extrabold text-sm flex items-center justify-center">{i + 1}</span>
              <div><div className="font-bold text-[15px]">{title}</div><div className="text-[13px] text-teal-50/75 mt-0.5">{text}</div></div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex gap-6 text-xs font-semibold text-teal-50/90">
          {CHIPS.map(([ic, t]) => <span key={t} className="inline-flex items-center gap-1.5"><Icon name={ic} size={14} /> {t}</span>)}
        </div>
      </div>
    </div>
  )
}

/** Auth pages: the form on the left, a "how it works" panel on the right.
 */
export function AuthShell({ children }) {
  return (
    <div className="min-h-screen lg:min-h-0 lg:h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-4 lg:px-8 pb-5 pt-0 bg-white lg:h-screen lg:min-h-0">
        <div className="h-16 flex items-center shrink-0"><Logo size={36} /></div>
        <div className="flex-1 flex items-center lg:min-h-0 lg:overflow-y-auto">
          <div className="auth-lg w-full max-w-md mx-auto lg:mx-0 lg:ml-[8%] py-6 rise">{children}</div>
        </div>
        <p className="text-xs text-stone-400">© PlacementPro · Campus aptitude tests</p>
      </div>
      <AuthPanel />
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[2.6rem] font-extrabold tracking-tight leading-[1.05] mb-2">Sign in</h1>
      <p className="text-base text-stone-500 mb-8">Use your email and password to continue.</p>
      <form onSubmit={submit} className="space-y-5">
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{error}</p>}
        <div className="field">
          <label className="lbl">Email</label>
          <input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="lbl">Password</label>
          <PasswordInput required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? 'Signing in…' : <>Continue <Icon name="arrow" size={16} /></>}</button>
      </form>
      <p className="mt-8 text-base text-stone-600">
        New student? <Link className="link" to="/register">Create an account</Link>
      </p>
    </AuthShell>
  )
}
