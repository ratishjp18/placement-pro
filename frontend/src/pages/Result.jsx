import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Spinner } from '../components/ui'

export default function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [r, setR] = useState(null)

  useEffect(() => { api(`/attempts/${id}/result/`).then(setR).catch(() => navigate('/')) }, [id, navigate])

  if (!r) return <Spinner />
  if (!r.finished) return <Navigate to={`/attempt/${id}`} replace />

  const tile = (label, value, sub) => (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value} {sub && <span className="text-sm font-normal text-slate-400">{sub}</span>}</div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="page-title mb-1">{r.title} — result</h1>
      <p className="text-sm text-slate-500 mb-4">Ended: {r.reason}</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {tile('Score', r.score, `/ ${r.total_marks}`)}
        {tile('Rank', r.rank, `of ${r.participants}`)}
        {tile('Violations', r.violations)}
      </div>
      {r.exam_open && <p className="text-xs text-amber-700 mb-3">The exam window is still open, so ranks can change as others submit.</p>}
      <table className="data">
        <thead><tr><th>Section</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Unanswered</th></tr></thead>
        <tbody>
          {r.sections.map((s) => (
            <tr key={s.label}><td>{s.label}</td><td>{s.score}</td><td>{s.correct}</td><td>{s.wrong}</td><td>{s.unanswered}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
