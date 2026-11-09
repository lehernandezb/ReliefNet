import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS = {
  Admin: [
    ['/admin', 'Overview'],
    ['/dispatcher', 'Emergencies'],
  ],
  Dispatcher: [['/dispatcher', 'Emergencies']],
  Client: [['/client', 'My Requests']],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <span className="brand">ReliefNet</span>
      <nav>
        {(LINKS[user.role] || []).map(([to, label]) => (
          <NavLink key={to} to={to} end>
            {label}
          </NavLink>
        ))}
      </nav>
      <span className="who">
        {user.name} · <em>{user.role}</em>
      </span>
      <button
        className="secondary"
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        Log out
      </button>
    </header>
  )
}
