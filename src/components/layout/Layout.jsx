import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './Header'
import { trackPageView } from '../../lib/tracking'

export default function Layout() {
  const location = useLocation()

  // Track page views
  useEffect(() => {
    trackPageView({ path: location.pathname })
  }, [location.pathname])

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
