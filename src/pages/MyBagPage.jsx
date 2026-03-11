import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBag } from '../hooks/useBag'
import Bag from '../components/Bag'
import DiscPicker from '../components/DiscPicker'
import ShareButton from '../components/ShareButton'
import discsData from '../data/discs.json'

export default function MyBagPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const {
    bag,
    loading,
    saving,
    saveError,
    setDisc,
    updateSlot,
    removeDisc,
    addSlot,
    removeSlot,
    clearBag
  } = useBag()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState(null)

  const handleSlotClick = (slotIndex) => {
    setActiveSlot(slotIndex)
    setPickerOpen(true)
  }

  const handleDiscSelect = (discId, photo = null) => {
    if (activeSlot === null) return
    setDisc(activeSlot, discId, photo)
    setPickerOpen(false)
    setActiveSlot(null)
  }

  const handlePhotoUpdate = (photo) => {
    if (activeSlot === null) return
    updateSlot(activeSlot, { photo })
  }

  const handlePlasticUpdate = (plastic) => {
    if (activeSlot === null) return
    updateSlot(activeSlot, { plastic })
  }

  const handleColorUpdate = (color) => {
    if (activeSlot === null) return
    updateSlot(activeSlot, { color })
  }

  const handleLinkUpdate = (link) => {
    if (activeSlot === null) return
    updateSlot(activeSlot, { link })
  }

  const handleRemoveDisc = () => {
    if (activeSlot === null) return
    removeDisc(activeSlot)
    setPickerOpen(false)
    setActiveSlot(null)
  }

  const handleClearBag = () => {
    if (window.confirm('Clear all discs from your bag?')) {
      clearBag()
    }
  }

  const generateShareUrl = () => {
    if (!user) return window.location.href
    return `${window.location.origin}/${user.id}`
  }

  const getDiscById = (id) => discsData.discs.find(d => String(d.id) === String(id))

  if (authLoading || loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your bag...</p>
      </div>
    )
  }

  return (
    <div className="my-bag-page">
      <div className="bag-header">
        <h1>{profile?.display_name ? `${profile.display_name}'s Bag` : 'My Bag'}</h1>
        {saving && <span className="saving-indicator">Saving...</span>}
        {saveError && <span className="save-error">{saveError}</span>}
      </div>

      <Bag
        bag={bag}
        onSlotClick={handleSlotClick}
        getDiscById={getDiscById}
        readOnly={false}
      />

      <div className="bag-controls">
        <button className="bag-control-btn" onClick={addSlot}>+ Add Slot</button>
        <button
          className="bag-control-btn"
          onClick={removeSlot}
          disabled={bag.length <= 1}
        >
          - Remove Slot
        </button>
        <button className="bag-control-btn clear-btn" onClick={handleClearBag}>
          Clear Bag
        </button>
      </div>

      <ShareButton
        generateUrl={generateShareUrl}
        playerName={profile?.display_name || ''}
      />

      {pickerOpen && (
        <DiscPicker
          discs={discsData.discs}
          currentSlot={activeSlot !== null ? bag[activeSlot] : null}
          onSelect={handleDiscSelect}
          onPhotoUpdate={handlePhotoUpdate}
          onPlasticUpdate={handlePlasticUpdate}
          onColorUpdate={handleColorUpdate}
          onLinkUpdate={handleLinkUpdate}
          onRemove={handleRemoveDisc}
          onClose={() => {
            setPickerOpen(false)
            setActiveSlot(null)
          }}
        />
      )}
    </div>
  )
}
