import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useToast } from '../../context'
import { Spinner } from '../../components/ui'

export default function Questions() {
  const toast = useToast()
  const [d, setD] = useState(null)
  const [filters, setFilters] = useState({ q: '', section: '', difficulty: '' })
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(() => {
    const params = new URLSearchParams({ ...filters, page })
    for (const [k, v] of [...params]) if (!v) params.delete(k)
    api(`/company/questions/?${params}`).then(setD)
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const remove = async (id) => {
    const r = await api(`/company/questions/${id}/`, { method: 'DELETE' })
    toast(r.deleted ? 'Question deleted.' : r.message, r.deleted ? 'success' : 'warning')
    setConfirmId(null)
    load()
  }
  const setFilter = (k) => (e) => { setPage(1); setFilters({ ...filters, [k]: e.target.value }) }

  if (!d) return <Spinner />

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Question bank <span className="text-sm font-normal text-stone-500">({d.count})</span></h1>
        <div className="flex gap-2">
          <Link to="/company/questions/import" className="btn btn-secondary">Import CSV</Link>
          <Link to="/company/questions/new" className="btn">Add question</Link>
        </div>
      </div>

      <div className="field flex flex-wrap gap-2 mb-4">
        <input placeholder="Search text" value={filters.q} onChange={setFilter('q')} style={{ width: '16rem' }} />
        <select value={filters.section} onChange={setFilter('section')} style={{ width: '11rem' }}>
          <option value="">All sections</option>
          {d.sections.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.difficulty} onChange={setFilter('difficulty')} style={{ width: '11rem' }}>
          <option value="">All difficulties</option>
          {d.difficulties.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <table className="data">
        <thead><tr><th>Question</th><th>Section</th><th>Topic</th><th>Level</th><th>Marks</th><th>Ans</th><th /></tr></thead>
        <tbody>
          {d.results.length === 0 && <tr><td colSpan="7" className="text-stone-500 text-center py-8">No questions found.</td></tr>}
          {d.results.map((q) => (
            <tr key={q.id} className={q.is_active ? '' : 'opacity-50'}>
              <td>{q.text.length > 90 ? q.text.slice(0, 90) + '…' : q.text}</td>
              <td>{q.section_label}</td><td>{q.topic}</td><td>{q.difficulty_label}</td><td>{q.marks}</td><td>{q.correct_option}</td>
              <td className="whitespace-nowrap text-sm">
                {confirmId === q.id ? (
                  <>
                    <span className="text-stone-500 mr-2">Delete?</span>
                    <button className="text-red-600 font-semibold mr-2" onClick={() => remove(q.id)}>Yes</button>
                    <button className="link" onClick={() => setConfirmId(null)}>No</button>
                  </>
                ) : (
                  <>
                    <Link className="link" to={`/company/questions/${q.id}/edit`}>Edit</Link>
                    <span className="text-stone-300 mx-1">|</span>
                    <button className="text-red-600 font-medium hover:underline" onClick={() => setConfirmId(q.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {d.pages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button className="btn btn-secondary" disabled={d.page <= 1} onClick={() => setPage(d.page - 1)}>Previous</button>
          <span>Page {d.page} of {d.pages}</span>
          <button className="btn btn-secondary" disabled={d.page >= d.pages} onClick={() => setPage(d.page + 1)}>Next</button>
        </div>
      )}
    </>
  )
}
