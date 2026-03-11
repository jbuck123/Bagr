import { useParams, Link } from 'react-router-dom'
import { usePublicBag } from '../hooks/useBag'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { userId } = useParams()
  const { profile, loading, error } = usePublicBag(userId)
  const { user } = useAuth()

  const isOwnProfile = user?.id === userId

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Profile Not Found</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span className="avatar-placeholder">
              {profile?.display_name?.[0] || '?'}
            </span>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile?.display_name || 'Anonymous'}</h1>
          {profile?.pdga_number && (
            <span className="pdga-number">PDGA #{profile.pdga_number}</span>
          )}
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>
        {isOwnProfile && (
          <Link to="/settings" className="btn btn-secondary">
            Edit Profile
          </Link>
        )}
      </div>

      <div className="profile-actions">
        <Link to={`/${userId}`} className="btn btn-primary">
          View Bag
        </Link>
      </div>
    </div>
  )
}
