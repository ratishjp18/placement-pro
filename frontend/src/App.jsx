import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './context'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentHome from './pages/StudentHome'
import Intro from './pages/Intro'
import Exam from './pages/Exam'
import Result from './pages/Result'
import Exams from './pages/company/Exams'
import ExamForm from './pages/company/ExamForm'
import Results from './pages/company/Results'
import Questions from './pages/company/Questions'
import QuestionForm from './pages/company/QuestionForm'
import ImportCSV from './pages/company/ImportCSV'

function Guard({ role }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/" replace />
  return <Outlet />
}

function Home() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'company') return <Navigate to="/company/exams" replace />
  return <StudentHome />
}

function Public({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Public><Login /></Public>} />
      <Route path="/register" element={<Public><Register /></Public>} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route element={<Guard role="student" />}>
          <Route path="/exam/:id" element={<Intro />} />
          <Route path="/attempt/:id/result" element={<Result />} />
        </Route>
        <Route element={<Guard role="company" />}>
          <Route path="/company/exams" element={<Exams />} />
          <Route path="/company/exams/new" element={<ExamForm />} />
          <Route path="/company/exams/:id/edit" element={<ExamForm />} />
          <Route path="/company/exams/:id/results" element={<Results />} />
          <Route path="/company/questions" element={<Questions />} />
          <Route path="/company/questions/new" element={<QuestionForm />} />
          <Route path="/company/questions/import" element={<ImportCSV />} />
          <Route path="/company/questions/:id/edit" element={<QuestionForm />} />
        </Route>
      </Route>

      {/* The exam screen is full-page, without the site header. */}
      <Route element={<Guard role="student" />}>
        <Route path="/attempt/:id" element={<Exam />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
