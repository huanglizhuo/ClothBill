import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTripStore } from '../../store/tripStore'

interface BottomNavProps {
  tripId: string
}

export default function BottomNav({ tripId }: BottomNavProps) {
  const isEditable = useTripStore((s) => s.isEditable)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const baseClass = 'flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 text-xs'
  const activeClass = 'text-primary-600'
  const inactiveClass = 'text-gray-400'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${baseClass} ${isActive ? activeClass : inactiveClass}`

  const showFab = isEditable && pathname === `/bill/${tripId}`

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-2xl lg:max-w-4xl z-10">
      {showFab && (
        <button
          type="button"
          onClick={() => navigate(`/bill/${tripId}/expense`)}
          className="absolute -top-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg active:bg-primary-700"
          aria-label="添加账单"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      <nav className="flex h-16 items-center border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <NavLink to={`/bill/${tripId}`} end className={linkClass}>
          {({ isActive }) => (
            <>
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
              </svg>
              <span>账单</span>
            </>
          )}
        </NavLink>

        <NavLink to={`/bill/${tripId}/settle`} className={linkClass}>
          {({ isActive }) => (
            <>
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M8 6h8M8 10h8M8 14h4M16 14l-4 4m0-4l4 4" />
              </svg>
              <span>结算</span>
            </>
          )}
        </NavLink>

        <NavLink to={`/bill/${tripId}/settings`} className={linkClass}>
          {({ isActive }) => (
            <>
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              <span>设置</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
