import DiscSlot from './DiscSlot'

function Bag({ bag, onSlotClick, getDiscById, readOnly }) {
  return (
    <div className="bag">
      <div className="bag-grid">
        {bag.map((slot, index) => (
          <DiscSlot
            key={index}
            disc={slot.discId ? getDiscById(slot.discId) : null}
            photo={slot.photo}
            plastic={slot.plastic}
            color={slot.color}
            link={slot.link}
            onClick={onSlotClick ? () => onSlotClick(index) : undefined}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

export default Bag
