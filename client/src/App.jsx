import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClientHome from './pages/client/ClientHome'
import DispatcherDashboard from './pages/dispatcher/DispatcherDashboard'
import EmergencyDetail from './pages/dispatcher/EmergencyDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute roles={['Client']} />}>
            <Route path="/client" element={<ClientHome />} />
          </Route>

          <Route element={<ProtectedRoute roles={['Dispatcher', 'Admin']} />}>
            <Route path="/dispatcher" element={<DispatcherDashboard />} />
            <Route path="/dispatcher/emergencies/:id" element={<EmergencyDetail />} />
          </Route>

          <Route element={<ProtectedRoute roles={['Admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
