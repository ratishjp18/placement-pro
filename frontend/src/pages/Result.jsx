import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Icon, Spinner } from '../components/ui'

function Ring({ value, total }) {
  const pct = total > 0 ? value / total : 0
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <div className="relative w-44 h-44 shrink-0">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" /></linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#eef0f7" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="url(#ring)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-extrabold leading-none">{value}<span className="text-xl text-slate-400 font-bold"> / {total}</span></div>
        <div className="text-xs text-slate-500 mt-1.5">questions attended</div>
      </div>
    </div>
  )
}

/** Students are only told how many questions they attended, never what was right or wrong. */
export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [r, setR] = useState(null)

  useEffect(() => { api(`/attempts/${id}/result/`).then(setR).catch(() => navigate('/')) }, [id, navigate])

  if (!r) return <Spinner />
  if (!r.finished) return <Navigate to={`/attempt/${id}`} replace />

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 flex flex-col sm:flex-row items-center gap-8">
        <Ring value={r.attended} total={r.total} />
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <Icon name="check" size={14} /> Test submitted
          </div>
          <h1 className="page-title mb-2">{r.title}</h1>
          <p className="text-slate-600">
            You attended <strong className="text-slate-900">{r.attended}</strong> out of <strong className="text-slate-900">{r.total}</strong> questions.
          </p>
          <p className="text-sm text-slate-400 mt-3">Your answers have been sent to the company. Thank you for taking the test.</p>
        </div>
      </div>
    </div>
  )
}
