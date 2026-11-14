import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fmtDate } from '../../api'
import { Icon, Spinner, StatTile, StatusBadge } from '../../components/ui'

export default function Exams() {
  const [d, setD] = useState(null)
  useEffect(() => { api('/company/exams/').then(setD) }, [])
  if (!d) return <Spinner />

  return (
    <>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="page-title">{d.company}</h1>
          <p className="text-stone-500 text-sm mt-0.5">Create tests and track how students perform.</p>
        </div>
        <Link to="/company/exams/new" className="btn"><Icon name="plus" size={16} /> Create exam</Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <StatTile icon="file" label="Exams" value={d.exams.length} tone="teal" />
        <StatTile icon="database" label="Questions in bank" value={d.question_total} tone="amber" />
        <StatTile icon="users" label="Student submissions" value={d.submission_total} tone="emerald" />
      </div>

      {d.question_total === 0 && (
        <div className="rounded-2xl p-4 mb-6 border border-amber-200 bg-amber-50 text-sm text-amber-900">
          Your question bank is empty. <Link className="font-semibold underline" to="/company/questions/new">Add a question</Link> or{' '}
          <Link className="font-semibold underline" to="/company/questions/import">import a CSV</Link> before creating an exam.
        </div>
      )}

      <table className="data">
        <thead><tr><th>Exam</th><th>Window</th><th>Duration</th><th>Questions</th><th>Submitted</th><th>Status</th><th /></tr></thead>
        <tbody>
          {d.exams.length === 0 && (
            <tr><td colSpan="7" className="text-stone-500 text-center py-12">No exams yet. Click “Create exam” to set up your first test.</td></tr>
          )}
          {d.exams.map((e) => (
            <tr key={e.id}>
              <td className="font-semibold">{e.title}</td>
              <td className="text-sm text-stone-600">{fmtDate(e.start_time)}<br /><span className="text-stone-400">→ {fmtDate(e.end_time)}</span></td>
              <td>{e.duration_minutes} min</td>
              <td>{e.question_count}</td>
              <td>{e.submissions}</td>
              <td><StatusBadge status={e.status} /></td>
              <td className="whitespace-nowrap text-sm">
                <Link className="link" to={`/company/exams/${e.id}/edit`}>Edit</Link>
                <span className="text-stone-300 mx-2">|</span>
                <Link className="link" to={`/company/exams/${e.id}/results`}>Results</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
