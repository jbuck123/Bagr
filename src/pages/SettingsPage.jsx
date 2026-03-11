import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function SettingsPage() {
  const { user, profile, updateProfile, uploadAvatar, updatePassword, signOut } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [pdgaNumber, setPdgaNumber] = useState(profile?.pdga_number || '')

  // Sync form state when profile loads after mount
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setPdgaNumber(profile.pdga_number || '')
    }
  }, [profile])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const fileInputRef = useRef(null)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    const { error } = await updateProfile({
      display_name: displayName,
      bio: bio,
      pdga_number: pdgaNumber || null
    })

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated!' })
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' })
      return
    }

    setUploadingAvatar(true)
    setMessage({ type: '', text: '' })

    const { error } = await uploadAvatar(file)

    setUploadingAvatar(false)
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' })
    } else {
      setMessage({ type: 'success', text: 'Avatar updated!' })
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setSaving(true)
    const { error } = await updatePassword(newPassword)
    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } else {
      setMessage({ type: 'success', text: 'Password updated!' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <section className="settings-section">
        <h2>Profile Picture</h2>
        <div className="avatar-upload">
          <div className="current-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Your avatar" />
            ) : (
              <span className="avatar-placeholder">
                {profile?.display_name?.[0] || user?.email?.[0] || '?'}
              </span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2>Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="pdgaNumber">PDGA Number</label>
            <input
              id="pdgaNumber"
              type="text"
              value={pdgaNumber}
              onChange={(e) => setPdgaNumber(e.target.value)}
              placeholder="123456"
              pattern="[0-9]*"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            Update Password
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2>Account</h2>
        <p className="account-email">Signed in as: {user?.email}</p>
        <button onClick={signOut} className="btn btn-secondary">
          Sign Out
        </button>
      </section>
    </div>
  )
}
