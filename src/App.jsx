import { useState, useEffect } from 'react'
import Bag from './components/Bag'
import DiscPicker from './components/DiscPicker'
import ShareButton from './components/ShareButton'
import discsData from './data/discs.json'

const DEFAULT_BAG_SIZE = 12

function App() {
  // Each slot: { discId: number | null, photo: string | null, plastic: string | null, color: string | null, link: string | null }
  const [bag, setBag] = useState(() =>
    Array(DEFAULT_BAG_SIZE).fill(null).map(() => ({ discId: null, photo: null, plastic: null, color: null, link: null }))
  )

  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState(null)
  const [playerName, setPlayerName] = useState('')

  // Load bag from URL on mount
  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#bag=')) {
      try {
        const data = JSON.parse(decodeURIComponent(hash.slice(5)))
        if (data.bag) setBag(data.bag)
        if (data.name) setPlayerName(data.name)
      } catch (e) {
        console.error('Failed to parse bag from URL')
      }
    }
  }, [])

  const handleSlotClick = (slotIndex) => {
    setActiveSlot(slotIndex)
    setPickerOpen(true)
  }

  const handleDiscSelect = (discId, photo = null) => {
    if (activeSlot === null) return

    setBag(prev => {
      const newBag = [...prev]
      newBag[activeSlot] = {
        discId,
        photo: photo !== null ? photo : prev[activeSlot]?.photo || null,
        plastic: prev[activeSlot]?.plastic || null,
        color: prev[activeSlot]?.color || null,
        link: prev[activeSlot]?.link || null
      }
      return newBag
    })

    setPickerOpen(false)
    setActiveSlot(null)
  }

  const handlePhotoUpdate = (photo) => {
    if (activeSlot === null) return

    setBag(prev => {
      const newBag = [...prev]
      newBag[activeSlot] = { ...prev[activeSlot], photo }
      return newBag
    })
  }

  const handlePlasticUpdate = (plastic) => {
    if (activeSlot === null) return

    setBag(prev => {
      const newBag = [...prev]
      newBag[activeSlot] = { ...prev[activeSlot], plastic }
      return newBag
    })
  }

  const handleColorUpdate = (color) => {
    if (activeSlot === null) return

    setBag(prev => {
      const newBag = [...prev]
      newBag[activeSlot] = { ...prev[activeSlot], color }
      return newBag
    })
  }

  const handleLinkUpdate = (link) => {
    if (activeSlot === null) return

    setBag(prev => {
      const newBag = [...prev]
      newBag[activeSlot] = { ...prev[activeSlot], link }
      return newBag
    })
  }

  const handleRemoveDisc = () => {
    if (activeSlot === null) return
    setBag(prev => {
      const newBag = [...prev]
      newBag[activeSlot] = { discId: null, photo: null, plastic: null, color: null, link: null }
      return newBag
    })
    setPickerOpen(false)
    setActiveSlot(null)
  }

  const addSlot = () => {
    setBag(prev => [...prev, { discId: null, photo: null, plastic: null, color: null, link: null }])
  }

  const removeLastSlot = () => {
    if (bag.length > 1) {
      setBag(prev => prev.slice(0, -1))
    }
  }

  const generateShareUrl = () => {
    const data = { bag, name: playerName }
    const encoded = encodeURIComponent(JSON.stringify(data))
    return `${window.location.origin}${window.location.pathname}#bag=${encoded}`
  }

  const getDiscById = (id) => discsData.discs.find(d => d.id === id)

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Bagr</h1>
        <p className="tagline">Build & Share Your Disc Golf Bag</p>
      </header>

      <div className="player-name-section">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="player-name-input"
        />
      </div>

      <Bag
        bag={bag}
        onSlotClick={handleSlotClick}
        getDiscById={getDiscById}
      />

      <div className="bag-controls">
        <button className="bag-control-btn" onClick={addSlot}>+ Add Slot</button>
        <button className="bag-control-btn" onClick={removeLastSlot} disabled={bag.length <= 1}>
          − Remove Slot
        </button>
      </div>

      <ShareButton generateUrl={generateShareUrl} />

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

export default App
