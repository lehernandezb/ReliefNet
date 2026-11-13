import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', firstName: '', lastName: '', email: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const u = mode === 'login' ? await login(form.username, form.password) : await register(form)
      navigate(HOME_BY_ROLE[u.role])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="brand"><Logo /></div>
        <h1>{mode === 'login' ? 'Log in to ReliefNet' : 'Create your ReliefNet account'}</h1>

        {mode === 'register' && (
          <div className="row">
            <label>First name<input value={form.firstName} onChange={set('firstName')} required /></label>
            <label>Last name<input value={form.lastName} onChange={set('lastName')} required /></label>
          </div>
        )}
        {mode === 'register' && (
          <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
        )}
        <label>Username<input value={form.username} onChange={set('username')} required autoFocus /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} required /></label>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="block">{mode === 'login' ? 'Log in' : 'Create account'}</button>

        <hr />
        <p className="muted center">
          {mode === 'login' ? 'Need help in an emergency? ' : 'Already have an account? '}
          <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Create a public account' : 'Log in'}
          </button>
        </p>
        {mode === 'login' && (
          <p className="muted small center">Demo users: admin, dispatcher or client. Password: password123</p>
        )}
      </form>
    </div>
  )
}
