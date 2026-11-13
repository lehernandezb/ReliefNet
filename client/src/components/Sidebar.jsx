import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { PRIORITY_TINT } from '../utils/format'
import Logo from './Logo'

const ICONS = {
  overview: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  emergencies: <path d="M12 3 2.5 20h19L12 3zm0 6.5v5m0 2.8v.2" />,
  requests: <path d="M5 4h14v12H9.5L5 20V4zm4 4.5h6M9 12h4" />,
  settings: <path d="M4 7h9m6 0h1M4 17h1m6 0h9M13 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0M5 17a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />,
}

const LINKS = {
  Admin: [
    ['/admin', 'Administration', 'overview'],
    ['/dispatcher', 'Emergencies', 'emergencies'],
  ],
  Dispatcher: [['/dispatcher', 'Emergencies', 'emergencies']],
  Client: [['/client', 'My requests', 'requests']],
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const canDispatch = user.role !== 'Client'

  return (
    <aside className="sidebar">
      <div className="panel sidebar-top">
        <div className="brand">
          <Logo />
          <span>ReliefNet</span>
        </div>
        <nav>
          {[...(LINKS[user.role] || []), ['/settings', 'Settings', 'settings']].map(([to, label, icon]) => (
            <NavLink key={to} to={to} end className="nav-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[icon]}
              </svg>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="account">
          <span className="avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase()}</span>
          <span className="text">
            <span className="name">{user.name}</span>
            <span className="muted small">{user.role}</span>
          </span>
          <button
            className="secondary small"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {canDispatch && (
        <div className="panel library">
          <EmergencyList />
        </div>
      )}
    </aside>
  )
}

/** Quick links to every active emergency; the bar colour is the priority */
function EmergencyList() {
  const emergencies = useApi('/emergencies')

  return (
    <>
      <p className="library-title">Active emergencies</p>
      <div className="library-list">
        {emergencies.data?.length === 0 && <p className="library-empty muted small">Nothing active right now.</p>}
        {emergencies.data?.map((e) => (
          <NavLink
            key={e.Emergency_ID}
            to={`/dispatcher/emergencies/${e.Emergency_ID}`}
            className="library-item"
            style={{ '--tint': PRIORITY_TINT[e.Priority] }}
          >
            <span className="name">{e.Name}</span>
            <span className="muted small">{e.Type}, {e.Priority?.toLowerCase()} priority</span>
          </NavLink>
        ))}
      </div>
    </>
  )
}
