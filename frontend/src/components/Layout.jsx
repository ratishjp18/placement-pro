import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { Icon, Logo } from './ui'

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-8">
          <Logo size={34} />
          <nav className="flex gap-1 flex-1">
            {user?.role === 'company' && (
              <>
                <NavLink to="/company/exams" className={linkClass}><Icon name="file" size={16} /> My exams</NavLink>
                <NavLink to="/company/questions" className={linkClass}><Icon name="database" size={16} /> Question bank</NavLink>
              </>
            )}
          </nav>
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center uppercase">
                  {user.name.slice(0, 1)}
                </div>
                <div className="leading-tight hidden sm:block">
                  <div className="text-[13px] font-semibold max-w-[10rem] truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{user.role}</div>
                </div>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-rose-600 font-semibold px-2 py-1"
                onClick={async () => { await logout(); navigate('/login') }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 rise">
        <Outlet />
      </main>
    </>
  )
}
