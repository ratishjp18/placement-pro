import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { Icon, Logo } from '../components/ui'

/** A static preview of the exam screen, shown beside the auth forms. */
function ExamPreview() {
  return (
    <div className="w-full max-w-sm rotate-[-2deg] rounded-2xl bg-white text-stone-900 shadow-2xl shadow-black/30 overflow-hidden">
      <div className="bg-teal-900 px-4 py-3 flex items-center justify-between text-white">
        <span className="text-xs font-bold text-teal-100">Aptitude Test · Round 1</span>
        <span className="font-mono text-sm font-bold text-amber-300 bg-white/10 rounded-md px-2 py-0.5">24:18</span>
      </div>
      <div className="h-1 bg-teal-900"><div className="h-full w-2/5 bg-amber-400" /></div>
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border ${
              i < 6 ? 'bg-teal-100 border-teal-300 text-teal-700' : i === 6 ? 'border-teal-700 ring-2 ring-teal-200' : 'bg-white border-stone-300 text-stone-500'}`}>{i + 1}</span>
          ))}
        </div>
        <p className="font-bold text-sm mb-3">What is 20% of 150?</p>
        {[['A', '20'], ['B', '25'], ['C', '30'], ['D', '35']].map(([l, t]) => (
          <div key={l} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 mb-1.5 text-sm ${l === 'C' ? 'border-teal-700 bg-teal-50' : 'border-stone-200'}`}>
            <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${l === 'C' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-500'}`}>{l}</span>{t}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Auth pages: form on the left, a live-test preview on the right. */
export function AuthShell({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 sm:px-12 py-8 bg-white">
        <Logo size={38} />
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-[10%] py-10 rise">{children}</div>
        </div>
        <p className="text-xs text-stone-400">© PlacementPro · Campus aptitude tests</p>
      </div>

      <div className="hidden lg:flex relative flex-col items-center justify-center gap-10 bg-teal-900 text-white p-12 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-[44px] border-white/5" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-400/10" />
        <div className="relative"><ExamPreview /></div>
        <div className="relative text-center max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight mb-3">Sit the test. <span className="text-amber-300">Get noticed.</span></h2>
          <p className="text-teal-100/80 text-sm">Timed aptitude tests from the companies visiting your campus, with answers saved as you go.</p>
          <div className="flex justify-center gap-5 mt-6 text-xs font-semibold text-teal-100">
            <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} /> Live timer</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14} /> Auto-save</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} /> One attempt</span>
          </div>
        </div>
      </div>
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
      <h1 className="text-[1.9rem] font-extrabold tracking-tight leading-tight mb-1.5">Sign in</h1>
      <p className="text-sm text-stone-500 mb-8">Use your email and password to continue.</p>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{error}</p>}
        <div className="field">
          <label className="lbl">Email</label>
          <input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="lbl">Password</label>
          <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-lg w-full" disabled={busy}>{busy ? 'Signing in…' : <>Continue <Icon name="arrow" size={16} /></>}</button>
      </form>
      <p className="mt-8 text-sm text-stone-600">
        New student? <Link className="link" to="/register">Create an account</Link>
      </p>
    </AuthShell>
  )
}
