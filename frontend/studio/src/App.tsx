import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStudioAuth } from '@/stores/auth-store'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import DramaCreatePage from '@/pages/DramaCreatePage'
import DramaEditPage from '@/pages/DramaEditPage'
import EpisodeCreatePage from '@/pages/EpisodeCreatePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useStudioAuth((s) => s.isAuthenticated)
  if (!isAuth) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dramas/new" element={<ProtectedRoute><DramaCreatePage /></ProtectedRoute>} />
        <Route path="/dramas/:id" element={<ProtectedRoute><DramaEditPage /></ProtectedRoute>} />
        <Route path="/episodes/new" element={<ProtectedRoute><EpisodeCreatePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
