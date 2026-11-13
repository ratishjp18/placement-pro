import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Icon, Spinner } from '../components/ui'

function ScoreRing({ score, total }) {
  const pct = total > 0 ? Math.max(0, Math.min(1, score / total)) : 0
  const r = 54
  const c = 2 * Math.PI * r
  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" /></linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="#eef0f7" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="url(#ring)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-extrabold leading-none">{score}</div>
        <div className="text-xs text-slate-500 mt-1">out of {total}</div>
      </div>
    </div>
  )
}

export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [r, setR] = useState(null)

  useEffect(() => { api(`/attempts/${id}/result/`).then(setR).catch(() => navigate('/')) }, [id, navigate])

  if (!r) return <Spinner />
  if (!r.finished) return <Navigate to={`/attempt/${id}`} replace />

  const stat = (icon, label, value, sub, tone) => (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}><Icon name={icon} size={20} /></div>
      <div>
        <div className="text-xl font-bold leading-none">{value} <span className="text-xs font-medium text-slate-400">{sub}</span></div>
        <div className="text-xs text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8 mb-5 flex flex-col sm:flex-row items-center gap-8">
        <ScoreRing score={Number(r.score)} total={Number(r.total_marks)} />
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <Icon name="check" size={14} /> Test submitted
          </div>
          <h1 className="page-title mb-1">{r.title}</h1>
          <p className="text-sm text-slate-500">Ended: {r.reason}</p>
          {r.exam_open && <p className="text-xs text-amber-700 mt-3">The test window is still open, so your rank can change as others submit.</p>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {stat('award', 'Your rank', `#${r.rank}`, `of ${r.participants}`, 'bg-amber-50 text-amber-600')}
        {stat('shield', 'Violations', r.violations, `of allowed`, 'bg-rose-50 text-rose-600')}
      </div>

      <h2 className="font-bold mb-3">Section-wise breakdown</h2>
      <table className="data">
        <thead><tr><th>Section</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Unanswered</th></tr></thead>
        <tbody>
          {r.sections.map((s) => (
            <tr key={s.label}>
              <td className="font-semibold">{s.label}</td><td className="font-semibold">{s.score}</td>
              <td className="text-emerald-600 font-medium">{s.correct}</td>
              <td className="text-rose-600 font-medium">{s.wrong}</td>
              <td className="text-slate-500">{s.unanswered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
