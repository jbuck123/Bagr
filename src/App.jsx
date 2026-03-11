import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import MyBagPage from './pages/MyBagPage'
import SettingsPage from './pages/SettingsPage'
import PublicBagPage from './pages/PublicBagPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Wrapper for login/signup to redirect if already logged in
function AuthRoute({ children }) {
  const { user, loading } = useAuth()

  // Don't redirect while still loading - show the page
  if (loading) return children
  if (user) return <Navigate to="/my-bag" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<HomePage />} />
        <Route
          path="login"
          element={<AuthRoute><LoginPage /></AuthRoute>}
        />
        <Route
          path="signup"
          element={<AuthRoute><SignupPage /></AuthRoute>}
        />
        <Route path="auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="my-bag" element={<MyBagPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Dynamic public routes (must be last) */}
        <Route path=":userId" element={<PublicBagPage />} />
        <Route path=":userId/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
