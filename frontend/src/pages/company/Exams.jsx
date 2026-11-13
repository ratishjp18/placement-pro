import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fmtDate } from '../../api'
import { Spinner, StatusBadge } from '../../components/ui'

export default function Exams() {
  const [d, setD] = useState(null)
  useEffect(() => { api('/company/exams/').then(setD) }, [])
  if (!d) return <Spinner />

  const tile = (label, value) => (
    <div className="card p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-bold">{value}</div></div>
  )

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">{d.company}</h1>
          <p className="text-slate-500 text-sm">Create tests and track how students perform.</p>
        </div>
        <Link to="/company/exams/new" className="btn">+ Create exam</Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {tile('Exams', d.exams.length)}
        {tile('Questions in bank', d.question_total)}
        {tile('Student submissions', d.submission_total)}
      </div>

      {d.question_total === 0 && (
        <div className="card p-4 mb-6 border-amber-200 bg-amber-50 text-sm text-amber-900">
          Your question bank is empty. <Link className="font-semibold underline" to="/company/questions/new">Add a question</Link> or{' '}
          <Link className="font-semibold underline" to="/company/questions/import">import a CSV</Link> before creating an exam.
        </div>
      )}

      <table className="data">
        <thead><tr><th>Title</th><th>Window</th><th>Duration</th><th>Questions</th><th>Submitted</th><th>Status</th><th /></tr></thead>
        <tbody>
          {d.exams.length === 0 && (
            <tr><td colSpan="7" className="text-slate-500 text-center py-8">No exams yet. Click “Create exam” to set up your first test.</td></tr>
          )}
          {d.exams.map((e) => (
            <tr key={e.id}>
              <td className="font-medium">{e.title}</td>
              <td className="text-sm text-slate-600">{fmtDate(e.start_time)}<br /><span className="text-slate-400">→ {fmtDate(e.end_time)}</span></td>
              <td>{e.duration_minutes} min</td>
              <td>{e.question_count}</td>
              <td>{e.submissions}</td>
              <td><StatusBadge status={e.status} /></td>
              <td className="whitespace-nowrap text-sm">
                <Link className="link" to={`/company/exams/${e.id}/edit`}>Edit</Link>
                <span className="text-slate-300 mx-1">|</span>
                <Link className="link" to={`/company/exams/${e.id}/results`}>Results</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
