function DiscSlot({ disc, photo, onClick }) {
  return (
    <div className={`disc-slot ${disc ? 'filled' : 'empty'}`} onClick={onClick}>
      {disc ? (
        <div className="disc-content">
          {photo && (
            <div className="disc-photo">
              <img src={photo} alt={disc.name} />
            </div>
          )}
          <div className="disc-info">
            <div className="disc-name">{disc.name}</div>
            <div className="disc-manufacturer">{disc.manufacturer}</div>
            <div className="disc-type">{disc.type}</div>
            <div className="disc-flight">
              <span>{disc.speed}</span>
              <span>{disc.glide}</span>
              <span>{disc.turn}</span>
              <span>{disc.fade}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="disc-empty">
          <span className="plus-icon">+</span>
          <span className="add-text">Add Disc</span>
        </div>
      )}
    </div>
  )
}

export default DiscSlot
