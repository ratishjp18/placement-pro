import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center text-sm">P</span>
            PlacementPro
          </div>
          <nav className="flex gap-1 flex-1">
            {user?.role === 'company' && (
              <>
                <NavLink to="/company/exams" className={linkClass}>My exams</NavLink>
                <NavLink to="/company/questions" className={linkClass}>Question bank</NavLink>
              </>
            )}
          </nav>
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center uppercase">
                {user.name.slice(0, 1)}
              </div>
              <button
                className="text-sm text-slate-500 hover:text-red-600 font-medium"
                onClick={async () => { await logout(); navigate('/login') }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </>
  )
}
