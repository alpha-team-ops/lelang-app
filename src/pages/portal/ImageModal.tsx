import { useEffect } from 'react';
import './styles/portal.css';

interface ImageModalProps {
  imageSrc: string;
  imageAlt: string;
  caption?: string;
  onClose: () => void;
}

export default function ImageModal({
  imageSrc,
  imageAlt,
  caption = '',
  onClose,
}: ImageModalProps) {
  // Prevent body scroll when modal opens
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);
  return (
    <>
      <div className="image-backdrop" onClick={onClose} />
      <div className="image-modal">
        <button className="image-close" onClick={onClose}>
          ✕
        </button>
        <div className="image-container">
          {imageSrc.startsWith('data:') || imageSrc.startsWith('http') ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div className="image-placeholder-large">{imageSrc}</div>
          )}
        </div>
        {caption && (
          <div className="image-caption">
            <p>{caption}</p>
          </div>
        )}
      </div>
    </>
  );
}
