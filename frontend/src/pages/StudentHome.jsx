import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api, fmtDate } from '../api'
import { Spinner } from '../components/ui'

/** No dashboard: a student is sent straight to the instructions of their current exam. */
export default function StudentHome() {
  const [data, setData] = useState(null)

  useEffect(() => { api('/student/home/').then(setData).catch(() => setData({ next: 'none', upcoming: [] })) }, [])

  if (!data) return <Spinner />
  if (data.next === 'intro') return <Navigate to={`/exam/${data.exam_id}`} replace />
  if (data.next === 'result') return <Navigate to={`/attempt/${data.attempt_id}/result`} replace />

  return (
    <div className="max-w-xl mx-auto card p-8 text-center mt-10">
      <div className="text-4xl mb-3">🕒</div>
      <h1 className="page-title mb-2">No exam is open right now</h1>
      <p className="text-slate-500 text-sm mb-5">When a company opens an aptitude test, you will see its instructions here after you log in.</p>
      {data.upcoming.map((e) => (
        <div key={e.id} className="text-left bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-2 text-sm">
          <strong>{e.title}</strong> · {e.company}<br />
          <span className="text-slate-600">Starts {fmtDate(e.start_time)}</span>
        </div>
      ))}
    </div>
  )
}
