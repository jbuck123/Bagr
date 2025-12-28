import DiscSlot from './DiscSlot'

function Bag({ bag, onSlotClick, getDiscById }) {
  return (
    <div className="bag">
      <div className="bag-grid">
        {bag.map((slot, index) => (
          <DiscSlot
            key={index}
            disc={slot.discId ? getDiscById(slot.discId) : null}
            photo={slot.photo}
            onClick={() => onSlotClick(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default Bag
