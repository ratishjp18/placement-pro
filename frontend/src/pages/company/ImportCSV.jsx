import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../api'
import { useToast } from '../../context'

export default function ImportCSV() {
  const navigate = useNavigate()
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return
    setBusy(true)
    setErrors([])
    const form = new FormData()
    form.append('file', file)
    try {
      const r = await api('/company/questions/import/', { method: 'POST', form })
      toast(`Imported ${r.imported} questions.`)
      navigate('/company/questions')
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.data.errors || [err.message])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto card p-7">
      <h1 className="page-title mb-3">Import questions from CSV</h1>
      <p className="text-sm text-slate-600 mb-1">Required columns:</p>
      <code className="block text-xs bg-slate-100 p-2 rounded mb-2">section, topic, difficulty, marks, text, option_a, option_b, option_c, option_d, correct_option</code>
      <p className="text-sm text-slate-600 mb-4">
        Sections: quant, logical, verbal, technical. Difficulty: easy, medium, hard.{' '}
        <a className="link" href="/api/company/questions/sample.csv">Download sample</a>. The import is all-or-nothing: any bad row cancels it.
      </p>
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3 mb-4">
          <p className="font-medium mb-1">Nothing was imported:</p>
          <ul className="list-disc pl-5">{errors.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div className="field"><input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files[0])} /></div>
        <button className="btn" disabled={!file || busy}>{busy ? 'Importing…' : 'Import'}</button>
      </form>
    </div>
  )
}
