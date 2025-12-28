import { useState, useMemo, useRef } from 'react'

function DiscPicker({ discs, currentSlot, onSelect, onPhotoUpdate, onRemove, onClose }) {
  const [search, setSearch] = useState('')
  const [manufacturer, setManufacturer] = useState('all')
  const [discType, setDiscType] = useState('all')
  const [photoUrl, setPhotoUrl] = useState(currentSlot?.photo || '')
  const fileInputRef = useRef(null)

  const manufacturers = useMemo(() => {
    const uniqueManufacturers = [...new Set(discs.map(d => d.manufacturer))]
    return uniqueManufacturers.sort()
  }, [discs])

  const discTypes = ['Distance Driver', 'Fairway Driver', 'Midrange', 'Putter']

  const filteredDiscs = useMemo(() => {
    return discs
      .filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                              d.manufacturer.toLowerCase().includes(search.toLowerCase())
        const matchesManufacturer = manufacturer === 'all' || d.manufacturer === manufacturer
        const matchesType = discType === 'all' || d.type === discType
        return matchesSearch && matchesManufacturer && matchesType
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [discs, search, manufacturer, discType])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result
        setPhotoUrl(dataUrl)
        onPhotoUpdate(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUrlChange = (url) => {
    setPhotoUrl(url)
    onPhotoUpdate(url)
  }

  const clearPhoto = () => {
    setPhotoUrl('')
    onPhotoUpdate(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <h3>Select Disc</h3>
          <button className="picker-close" onClick={onClose}>&times;</button>
        </div>

        {/* Photo Section */}
        <div className="picker-photo-section">
          <div className="photo-label">Add Photo</div>
          <div className="photo-controls">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="photo-file-input"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="photo-upload-btn">
              Upload Photo
            </label>
            <span className="photo-or">or</span>
            <input
              type="text"
              placeholder="Paste image URL..."
              value={photoUrl && !photoUrl.startsWith('data:') ? photoUrl : ''}
              onChange={e => handlePhotoUrlChange(e.target.value)}
              className="photo-url-input"
            />
          </div>
          {photoUrl && (
            <div className="photo-preview">
              <img src={photoUrl} alt="Disc preview" />
              <button className="photo-clear-btn" onClick={clearPhoto}>&times;</button>
            </div>
          )}
        </div>

        <div className="picker-filters">
          <input
            type="text"
            placeholder="Search discs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="picker-search"
          />
          <select
            value={discType}
            onChange={e => setDiscType(e.target.value)}
            className="picker-type"
          >
            <option value="all">All Types</option>
            {discTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={manufacturer}
            onChange={e => setManufacturer(e.target.value)}
            className="picker-manufacturer"
          >
            <option value="all">All Brands</option>
            {manufacturers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {currentSlot?.discId && (
          <button className="remove-disc-btn" onClick={onRemove}>
            Remove Current Disc
          </button>
        )}

        <div className="picker-list">
          {filteredDiscs.map(disc => (
            <div
              key={disc.id}
              className={`picker-item ${currentSlot?.discId === disc.id ? 'selected' : ''}`}
              onClick={() => onSelect(disc.id)}
            >
              <div className="picker-item-info">
                <div className="picker-item-name">{disc.name}</div>
                <div className="picker-item-meta">
                  <span className="picker-item-manufacturer">{disc.manufacturer}</span>
                  <span className="picker-item-type">{disc.type}</span>
                </div>
              </div>
              <div className="picker-item-flight">
                <span title="Speed">{disc.speed}</span>
                <span title="Glide">{disc.glide}</span>
                <span title="Turn">{disc.turn}</span>
                <span title="Fade">{disc.fade}</span>
              </div>
            </div>
          ))}
          {filteredDiscs.length === 0 && (
            <div className="picker-empty">No discs found</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiscPicker
