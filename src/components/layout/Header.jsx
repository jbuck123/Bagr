import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../data/Logos/DG_Bag_logo_transparent_1.png'

export default function Header() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="header">
      <Link to="/" className="logo-link">
        <img src={Logo} alt="dgbag" className="logo-image" />
      </Link>

      <nav className="header-nav">
        {user ? (
          <>
            <Link to="/my-bag" className="nav-link">My Bag</Link>
            <div className="user-menu">
              <button className="user-menu-btn">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="user-avatar-small" />
                ) : (
                  <span className="user-avatar-placeholder">
                    {profile?.display_name?.[0] || user.email?.[0] || '?'}
                  </span>
                )}
              </button>
              <div className="user-dropdown">
                <Link to="/my-bag" className="dropdown-item">My Bag</Link>
                <Link to={`/${user.id}/profile`} className="dropdown-item">Profile</Link>
                <Link to="/settings" className="dropdown-item">Settings</Link>
                <button onClick={handleSignOut} className="dropdown-item dropdown-signout">
                  Sign Out
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Log In</Link>
            <Link to="/signup" className="nav-link nav-link-primary">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  )
}
