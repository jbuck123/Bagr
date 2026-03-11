import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Build Your Disc Golf Bag</h1>
        <p className="hero-subtitle">
          Create, customize, and share your disc golf bag with the community.
          Track your discs, add photos, and show off your setup.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/my-bag" className="btn btn-primary">
              Go to My Bag
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">+</div>
          <h3>Build Your Bag</h3>
          <p>Choose from 2000+ real discs with flight numbers and stats</p>
        </div>
        <div className="feature">
          <div className="feature-icon">*</div>
          <h3>Customize</h3>
          <p>Add photos of your actual discs, set colors, and plastic types</p>
        </div>
        <div className="feature">
          <div className="feature-icon">&gt;</div>
          <h3>Share</h3>
          <p>Share your bag with friends or the disc golf community</p>
        </div>
      </section>
    </div>
  )
}
