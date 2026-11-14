import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { Icon, Logo } from './ui'

/**
 * Companies get a dark left sidebar (a workspace). Students get a slim top bar and a focused, centred page.
 */
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = async () => { await logout(); navigate('/login') }

  if (user?.role === 'company') {
    const link = ({ isActive }) =>
      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        isActive ? 'bg-white/12 text-white shadow-[inset_3px_0_0_#fbbf24]' : 'text-teal-100/70 hover:bg-white/8 hover:text-white'}`
    return (
      <div className="lg:flex lg:h-screen min-h-screen lg:min-h-0">
        <aside className="lg:w-64 lg:shrink-0 bg-teal-900 text-white lg:sticky lg:top-0 lg:h-screen flex lg:flex-col items-center lg:items-stretch gap-4 p-4 lg:p-5">
          <div className="lg:mb-6 lg:px-1"><Logo size={36} light /></div>
          <nav className="flex lg:flex-col gap-1 flex-1">
            <div className="hidden lg:block text-[10px] font-bold uppercase tracking-[.14em] text-teal-300/60 px-3.5 mb-1">Workspace</div>
            <NavLink to="/company/exams" className={link}><Icon name="file" size={17} /> My exams</NavLink>
            <NavLink to="/company/questions" className={link}><Icon name="database" size={17} /> Question bank</NavLink>
          </nav>
          <div className="lg:border-t lg:border-white/10 lg:pt-4 flex lg:flex-col items-center lg:items-stretch gap-3">
            <div className="hidden lg:flex items-center gap-3 px-1">
              <div className="w-9 h-9 rounded-lg bg-amber-400 text-stone-900 font-extrabold flex items-center justify-center uppercase">{user.name.slice(0, 1)}</div>
              <div className="min-w-0 leading-tight">
                <div className="text-sm font-bold truncate">{user.name}</div>
                <div className="text-[11px] text-teal-200/70">Company account</div>
              </div>
            </div>
            <button onClick={signOut} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-teal-100/70 hover:bg-white/8 hover:text-white">
              <Icon name="logout" size={16} /> Log out
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 px-5 py-7 lg:px-10 lg:py-8 lg:h-screen lg:overflow-y-auto rise"><div className="max-w-5xl"><Outlet /></div></main>
      </div>
    )
  }

  return (
    <div className="lg:h-screen lg:flex lg:flex-col">
      <header className="bg-white border-b border-stone-200 shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size={34} />
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-sm font-bold max-w-[14rem] truncate">{user.name}</div>
                <div className="text-[11px] text-stone-500">Student</div>
              </div>
              <button className="btn btn-secondary !py-2" onClick={signOut}><Icon name="logout" size={15} /> Log out</button>
            </div>
          )}
        </div>
      </header>
      <main className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto"><div className="max-w-5xl mx-auto px-4 py-6 rise"><Outlet /></div></main>
    </div>
  )
}
