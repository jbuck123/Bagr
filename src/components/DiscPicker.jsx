import { useState, useMemo, useRef, useCallback, useEffect } from 'react'

// Detect disc edges and crop image to fill circle
// Handles multi-colored discs (Halo plastic) and black rims (MVP, etc.)
const cropDiscFromImage = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        const imageData = ctx.getImageData(0, 0, img.width, img.height)
        const data = imageData.data
        const width = img.width
        const height = img.height
        const centerX = width / 2
        const centerY = height / 2
        const maxRadius = Math.min(width, height) / 2

        const getPixel = (x, y) => {
          x = Math.floor(Math.max(0, Math.min(width - 1, x)))
          y = Math.floor(Math.max(0, Math.min(height - 1, y)))
          const i = (y * width + x) * 4
          return { r: data[i], g: data[i + 1], b: data[i + 2] }
        }

        const colorDistance = (c1, c2) => {
          return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
          )
        }

        // Sample background from the four corners more extensively
        const getBackgroundColor = () => {
          const samples = []
          const edgeSize = Math.min(width, height) * 0.08

          // Sample corners thoroughly
          for (let x = 0; x < edgeSize; x += 3) {
            for (let y = 0; y < edgeSize; y += 3) {
              samples.push(getPixel(x, y)) // top-left
              samples.push(getPixel(width - 1 - x, y)) // top-right
              samples.push(getPixel(x, height - 1 - y)) // bottom-left
              samples.push(getPixel(width - 1 - x, height - 1 - y)) // bottom-right
            }
          }

          // Average the samples
          const avg = {
            r: Math.round(samples.reduce((s, c) => s + c.r, 0) / samples.length),
            g: Math.round(samples.reduce((s, c) => s + c.g, 0) / samples.length),
            b: Math.round(samples.reduce((s, c) => s + c.b, 0) / samples.length)
          }

          return avg
        }

        const bgColor = getBackgroundColor()
        const isWhiteBg = bgColor.r > 200 && bgColor.g > 200 && bgColor.b > 200

        // Find disc by scanning from outside in
        // Look for where we transition from background to disc
        const findDiscEdge = () => {
          const samples = 120 // More samples for accuracy
          const radiiFound = []

          for (let a = 0; a < samples; a++) {
            const angle = (a / samples) * Math.PI * 2
            const dx = Math.cos(angle)
            const dy = Math.sin(angle)

            let lastWasBackground = true
            let edgeRadius = maxRadius * 0.5

            // Scan from outside toward center
            for (let r = maxRadius - 1; r > maxRadius * 0.15; r -= 1) {
              const x = centerX + dx * r
              const y = centerY + dy * r

              if (x < 0 || x >= width || y < 0 || y >= height) continue

              const pixel = getPixel(x, y)
              const distToBg = colorDistance(pixel, bgColor)

              // More lenient threshold for white backgrounds (catches anti-aliasing)
              const threshold = isWhiteBg ? 25 : 40

              const isBackground = distToBg < threshold

              if (lastWasBackground && !isBackground) {
                // Found transition from background to disc
                edgeRadius = r
                break
              }
              lastWasBackground = isBackground
            }

            radiiFound.push(edgeRadius)
          }

          // Use maximum radius found (captures full disc including any rim)
          radiiFound.sort((a, b) => b - a) // Sort descending
          // Take the larger values - use 90th percentile of largest
          const topRadii = radiiFound.slice(0, Math.floor(radiiFound.length * 0.9))
          const avgTopRadius = topRadii.reduce((s, r) => s + r, 0) / topRadii.length

          return avgTopRadius
        }

        let discRadius = findDiscEdge()

        // For discs that nearly fill the frame, use most of the image
        if (discRadius > maxRadius * 0.9) {
          discRadius = maxRadius * 0.98
        }

        // IMPORTANT: Crop INWARD slightly to eliminate any background edge artifacts
        // This ensures no white border - we'd rather lose a tiny bit of rim than show background
        const cropRadius = discRadius * 0.97

        // Ensure minimum size
        const finalRadius = Math.max(cropRadius, maxRadius * 0.4)

        // Calculate crop area
        const cropSize = finalRadius * 2
        const cropX = centerX - finalRadius
        const cropY = centerY - finalRadius

        // Create output canvas
        const outputSize = 400
        const outputCanvas = document.createElement('canvas')
        const outputCtx = outputCanvas.getContext('2d')
        outputCanvas.width = outputSize
        outputCanvas.height = outputSize

        // Draw cropped disc
        outputCtx.drawImage(
          canvas,
          Math.max(0, cropX),
          Math.max(0, cropY),
          Math.min(cropSize, width),
          Math.min(cropSize, height),
          0, 0, outputSize, outputSize
        )

        resolve(outputCanvas.toDataURL('image/jpeg', 0.92))
      } catch (e) {
        console.error('Crop error:', e)
        resolve(imageUrl)
      }
    }

    img.onerror = () => {
      resolve(imageUrl)
    }

    img.src = imageUrl
  })
}

// Extract dominant color from an image
// For Halo plastic discs, focuses on the CENTER to avoid picking up rim color
const extractDominantColor = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Sample a smaller version for performance
      const sampleSize = 100
      canvas.width = sampleSize
      canvas.height = sampleSize

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

      try {
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
        const data = imageData.data

        // Color buckets for averaging
        const colorCounts = {}
        const centerX = sampleSize / 2
        const centerY = sampleSize / 2
        // Only sample the center 60% of the disc to avoid Halo rims
        const maxSampleRadius = sampleSize * 0.30

        for (let y = 0; y < sampleSize; y++) {
          for (let x = 0; x < sampleSize; x++) {
            // Calculate distance from center
            const dx = x - centerX
            const dy = y - centerY
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Skip pixels outside the center circle (avoids Halo rim)
            if (distance > maxSampleRadius) continue

            const i = (y * sampleSize + x) * 4
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]

            // Skip transparent pixels
            if (a < 128) continue

            // Skip very dark or very light pixels (likely background/reflections)
            const brightness = (r + g + b) / 3
            if (brightness < 30 || brightness > 240) continue

            // Quantize colors to reduce noise (group similar colors)
            const qr = Math.round(r / 32) * 32
            const qg = Math.round(g / 32) * 32
            const qb = Math.round(b / 32) * 32

            const key = `${qr},${qg},${qb}`
            colorCounts[key] = (colorCounts[key] || 0) + 1
          }
        }

        // Find most common color
        let maxCount = 0
        let dominantColor = '99,102,241' // Default indigo

        for (const [color, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count
            dominantColor = color
          }
        }

        const [r, g, b] = dominantColor.split(',').map(Number)
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

        resolve(hex)
      } catch (e) {
        // CORS or other error, return default
        resolve('#6366F1')
      }
    }

    img.onerror = () => {
      resolve('#6366F1')
    }

    img.src = imageUrl
  })
}

const DISC_COLORS = [
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#22D3EE' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'White', value: '#f8fafc' },
  { name: 'Gray', value: '#64748b' },
]

function DiscPicker({ discs, currentSlot, onSelect, onPhotoUpdate, onPlasticUpdate, onColorUpdate, onLinkUpdate, onRemove, onClose }) {
  const [search, setSearch] = useState('')
  const [manufacturer, setManufacturer] = useState('all')
  const [discType, setDiscType] = useState('all')
  const [photoUrl, setPhotoUrl] = useState(currentSlot?.photo || '')
  const [plastic, setPlastic] = useState(currentSlot?.plastic || '')
  const [color, setColor] = useState(currentSlot?.color || '#7c3aed')
  const [link, setLink] = useState(currentSlot?.link || '')
  const [selectedDiscId, setSelectedDiscId] = useState(currentSlot?.discId || null)
  const [appearanceMode, setAppearanceMode] = useState(currentSlot?.photo ? 'photo' : 'color')
  const fileInputRef = useRef(null)

  // Lock body scroll when modal is open (mobile fix)
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.classList.add('modal-open')
    document.body.style.top = `-${scrollY}px`

    return () => {
      document.body.classList.remove('modal-open')
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const manufacturers = useMemo(() => {
    const uniqueManufacturers = [...new Set(discs.map(d => d.manufacturer))]
    return uniqueManufacturers.sort()
  }, [discs])

  const discTypes = ['Distance Driver', 'Fairway Driver', 'Midrange', 'Putter']

  const filteredDiscs = useMemo(() => {
    const searchLower = search.toLowerCase().trim()

    return discs
      .filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchLower) ||
                              d.manufacturer.toLowerCase().includes(searchLower)
        const matchesManufacturer = manufacturer === 'all' || d.manufacturer === manufacturer
        const matchesType = discType === 'all' || d.type === discType
        return matchesSearch && matchesManufacturer && matchesType
      })
      .sort((a, b) => {
        // If no search, sort alphabetically
        if (!searchLower) return a.name.localeCompare(b.name)

        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()

        // Exact match first
        const aExact = aName === searchLower
        const bExact = bName === searchLower
        if (aExact && !bExact) return -1
        if (bExact && !aExact) return 1

        // Prefix match second (name starts with search term)
        const aPrefix = aName.startsWith(searchLower)
        const bPrefix = bName.startsWith(searchLower)
        if (aPrefix && !bPrefix) return -1
        if (bPrefix && !aPrefix) return 1

        // Word boundary match third (search term appears after a space)
        const aWordBoundary = aName.includes(' ' + searchLower)
        const bWordBoundary = bName.includes(' ' + searchLower)
        if (aWordBoundary && !bWordBoundary) return -1
        if (bWordBoundary && !aWordBoundary) return 1

        // Finally, sort by name length (shorter names first) then alphabetically
        if (aName.length !== bName.length) return aName.length - bName.length
        return aName.localeCompare(bName)
      })
  }, [discs, search, manufacturer, discType])

  const analyzeAndSetColor = useCallback(async (imageUrl) => {
    if (imageUrl) {
      const dominantColor = await extractDominantColor(imageUrl)
      setColor(dominantColor)
      onColorUpdate(dominantColor)
    }
  }, [onColorUpdate])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const dataUrl = event.target?.result
        // Crop disc from image and extract color
        const croppedImage = await cropDiscFromImage(dataUrl)
        setPhotoUrl(croppedImage)
        onPhotoUpdate(croppedImage)
        await analyzeAndSetColor(croppedImage)
      }
      reader.readAsDataURL(file)
    }
  }

  const [urlInput, setUrlInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const processImageUrl = async (url) => {
    if (!url || !url.trim()) return

    setIsProcessing(true)
    try {
      // Try to crop disc from image
      const croppedImage = await cropDiscFromImage(url)
      setPhotoUrl(croppedImage)
      onPhotoUpdate(croppedImage)
      await analyzeAndSetColor(croppedImage)
    } catch (e) {
      // If processing fails, just use original URL
      setPhotoUrl(url)
      onPhotoUpdate(url)
    }
    setIsProcessing(false)
  }

  const handlePhotoUrlChange = (url) => {
    setUrlInput(url)
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      processImageUrl(urlInput.trim())
    }
  }

  const clearPhoto = () => {
    setPhotoUrl('')
    onPhotoUpdate(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePlasticChange = (value) => {
    setPlastic(value)
    onPlasticUpdate(value || null)
  }

  const handleLinkChange = (value) => {
    setLink(value)
    onLinkUpdate(value || null)
  }

  const handleColorChange = (value) => {
    setColor(value)
    onColorUpdate(value)
  }

  const switchToPhoto = () => {
    setAppearanceMode('photo')
  }

  const switchToColor = () => {
    setAppearanceMode('color')
    // Clear photo when switching to color mode
    setPhotoUrl('')
    onPhotoUpdate(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    if (selectedDiscId) {
      onSelect(selectedDiscId)
    } else {
      onClose()
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleTouchMove = (e) => {
    // Prevent background scroll on overlay touch
    if (e.target === e.currentTarget) {
      e.preventDefault()
    }
  }

  return (
    <div
      className="picker-overlay"
      onClick={handleOverlayClick}
      onTouchMove={handleTouchMove}
    >
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <div className="picker-header">
          <h3>Select Disc</h3>
          <button className="picker-close" onClick={onClose}>&times;</button>
        </div>

        {/* Appearance Section */}
        <div className="picker-appearance-section">
          <div className="appearance-label">Disc Appearance</div>
          <div className="appearance-toggle">
            <button
              className={`appearance-option ${appearanceMode === 'photo' ? 'active' : ''}`}
              onClick={switchToPhoto}
            >
              Add Photo
            </button>
            <button
              className={`appearance-option ${appearanceMode === 'color' ? 'active' : ''}`}
              onClick={switchToColor}
            >
              Choose Color
            </button>
          </div>

          {appearanceMode === 'photo' && (
            <div className="photo-content">
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
                  value={urlInput}
                  onChange={e => handlePhotoUrlChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                  className="photo-url-input"
                />
                <button
                  className="photo-load-btn"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || isProcessing}
                >
                  {isProcessing ? 'Loading...' : 'Load'}
                </button>
              </div>
              {photoUrl && (
                <div className="photo-preview">
                  <img src={photoUrl} alt="Disc preview" />
                  <button className="photo-clear-btn" onClick={clearPhoto}>&times;</button>
                </div>
              )}
            </div>
          )}

          {appearanceMode === 'color' && (
            <div className="color-content">
              <div className="color-options">
                {DISC_COLORS.map(c => (
                  <button
                    key={c.value}
                    className={`color-swatch ${color === c.value ? 'selected' : ''}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => handleColorChange(c.value)}
                    title={c.name}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => handleColorChange(e.target.value)}
                  className="color-custom"
                  title="Custom color"
                />
              </div>
            </div>
          )}
        </div>

        {/* Plastic Section */}
        <div className="picker-plastic-section">
          <div className="plastic-label">Plastic Type</div>
          <input
            type="text"
            placeholder="e.g., Star, Champion, ESP, K1..."
            value={plastic}
            onChange={e => handlePlasticChange(e.target.value)}
            className="plastic-input"
          />
        </div>

        {/* Shop Link Section */}
        <div className="picker-link-section">
          <div className="link-label">Shop Link</div>
          <input
            type="url"
            placeholder="Link to buy this disc..."
            value={link}
            onChange={e => handleLinkChange(e.target.value)}
            className="link-input"
          />
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
          {search.trim() === '' ? (
            <div className="picker-empty">Start typing to search for discs...</div>
          ) : filteredDiscs.length === 0 ? (
            <div className="picker-empty">No discs found</div>
          ) : (
            filteredDiscs.map(disc => (
              <div
                key={disc.id}
                className={`picker-item ${selectedDiscId === disc.id ? 'selected' : ''}`}
                onClick={() => setSelectedDiscId(disc.id)}
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
            ))
          )}
        </div>

        <div className="picker-actions">
          <button className="picker-save-btn" onClick={handleSave}>
            {selectedDiscId ? 'Save' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiscPicker
