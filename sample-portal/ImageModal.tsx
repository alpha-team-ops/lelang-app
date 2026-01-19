interface ImageModalProps {
  imagePlaceholder: string
  barangNama: string
  isOpen: boolean
  onClose: () => void
}

export function ImageModal({ imagePlaceholder, barangNama, isOpen, onClose }: ImageModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="image-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="image-modal">
        {/* Close Button */}
        <button className="image-close" onClick={onClose}>✕</button>

        {/* Image Container */}
        <div className="image-container">
          <div className="image-placeholder-large">{imagePlaceholder}</div>
        </div>

        {/* Caption */}
        <div className="image-caption">
          <p>{barangNama}</p>
        </div>
      </div>
    </>
  )
}
