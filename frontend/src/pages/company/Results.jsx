import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../api'
import { Spinner } from '../../components/ui'

export default function Results() {
  const { id } = useParams()
  const [d, setD] = useState(null)
  useEffect(() => { api(`/company/exams/${id}/results/`).then(setD) }, [id])
  if (!d) return <Spinner />

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">{d.exam.title} — results</h1>
          <p className="text-sm text-stone-500">
            {d.rows.length} submission(s) · total marks {d.exam.total_marks}
            {d.exam.status === 'active' && ' · exam still running, ranks may change'}
          </p>
        </div>
        <a className="btn" href={`/api/company/exams/${id}/results.csv`}>Export CSV</a>
      </div>
      <div className="overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Rank</th><th>Roll no.</th><th>Name</th><th>Email</th>
              {d.sections.map((s) => <th key={s.value}>{s.label}</th>)}
              <th>Total</th><th>Violations</th><th>Ended by</th>
            </tr>
          </thead>
          <tbody>
            {d.rows.length === 0 && <tr><td colSpan="9" className="text-stone-500 text-center py-8">No submissions yet.</td></tr>}
            {d.rows.map((r) => (
              <tr key={r.rank}>
                <td className="font-semibold">{r.rank}</td>
                <td>{r.roll_number || '—'}</td><td>{r.name}</td><td>{r.email}</td>
                {r.sections.map((s, i) => (
                  <td key={i}>{s ? <>{s.score} <span className="text-xs text-stone-400">({s.correct}✓ {s.wrong}✗)</span></> : 0}</td>
                ))}
                <td className="font-semibold">{r.score}</td><td>{r.violations}</td><td className="text-sm">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
