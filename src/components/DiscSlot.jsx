function DiscSlot({ disc, photo, plastic, color, link, onClick }) {
  const discColor = color || '#7c3aed'

  // Circle style - gradient for color mode, clean for photo mode
  const circleStyle = photo ? {} : {
    background: `radial-gradient(circle at 30% 30%,
      rgba(255, 255, 255, 0.3) 0%,
      ${discColor}80 40%,
      ${discColor} 100%)`
  }

  const handleShopClick = (e) => {
    e.stopPropagation()
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={`disc-slot ${disc ? 'filled' : 'empty'}`}
      onClick={onClick}
    >
      {disc ? (
        <div className="disc-content">
          <div className="disc-circle" style={circleStyle}>
            {photo && <img src={photo} alt={disc.name} />}
          </div>
          <div className="disc-info">
            <div className="disc-name">{disc.name}</div>
            <div className="disc-manufacturer">{disc.manufacturer}</div>
            {plastic && <div className="disc-plastic">{plastic}</div>}
            <div className="disc-type">{disc.type}</div>
            <div className="disc-flight">
              <span>{disc.speed}</span>
              <span>{disc.glide}</span>
              <span>{disc.turn}</span>
              <span>{disc.fade}</span>
            </div>
            {link && (
              <button className="disc-shop-link" onClick={handleShopClick} title="Buy this disc">
                Shop
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="disc-empty">
          <div className="empty-circle">
            <span className="plus-icon">+</span>
          </div>
          <span className="add-text">Add Disc</span>
        </div>
      )}
    </div>
  )
}

export default DiscSlot
