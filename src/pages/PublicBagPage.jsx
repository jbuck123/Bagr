import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePublicBag } from '../hooks/useBag'
import { useAuth } from '../hooks/useAuth'
import Bag from '../components/Bag'
import ShareButton from '../components/ShareButton'
import discsData from '../data/discs.json'
import { trackBagView } from '../lib/tracking'

export default function PublicBagPage() {
  const { userId } = useParams()
  const { bag, profile, loading, error } = usePublicBag(userId)
  const { user } = useAuth()

  const isOwnBag = user?.id === userId

  // Track bag view
  useEffect(() => {
    if (userId && !isOwnBag) {
      trackBagView(userId)
    }
  }, [userId, isOwnBag])

  const getDiscById = (id) => discsData.discs.find(d => String(d.id) === String(id))

  const generateShareUrl = () => {
    return `${window.location.origin}/${userId}`
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading bag...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Bag Not Found</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    )
  }

  return (
    <div className="public-bag-page">
      <div className="shared-bag-banner">
        <div className="profile-preview">
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="" className="profile-avatar-small" />
          )}
          <span className="profile-name">
            {profile?.display_name || 'Anonymous'}'s Bag
          </span>
          {profile?.pdga_number && (
            <span className="pdga-badge">PDGA #{profile.pdga_number}</span>
          )}
        </div>
        <div className="banner-actions">
          <Link to={`/${userId}/profile`} className="btn btn-secondary btn-small">
            View Profile
          </Link>
          {isOwnBag ? (
            <Link to="/my-bag" className="btn btn-primary btn-small">
              Edit Bag
            </Link>
          ) : !user ? (
            <Link to="/signup" className="btn btn-primary btn-small">
              Create Your Bag
            </Link>
          ) : null}
        </div>
      </div>

      <Bag
        bag={bag}
        onSlotClick={undefined}
        getDiscById={getDiscById}
        readOnly={true}
        bagOwnerId={userId}
      />

      <ShareButton
        generateUrl={generateShareUrl}
        playerName={profile?.display_name || ''}
      />
    </div>
  )
}
