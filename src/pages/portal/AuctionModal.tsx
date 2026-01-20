import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { PortalAuction } from '../../data/types';
import './styles/portal.css';

interface AuctionModalProps {
  auction: PortalAuction;
  onClose: () => void;
  onBidSuccess: (newPrice: number) => void;
}

const MIN_BID_INCREMENT = 50000;

export default function AuctionModal({ auction, onClose, onBidSuccess }: AuctionModalProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Prevent body scroll when modal opens
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleBidChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only numbers
    setBidAmount(value);
    setError('');
  };

  const formatCurrency = (value: string): string => {
    if (!value) return '';
    return parseInt(value).toLocaleString('id-ID');
  };

  const validateBid = (): boolean => {
    if (!bidAmount) {
      setError('Silakan masukkan jumlah penawaran');
      return false;
    }

    const bidValue = parseInt(bidAmount);
    const minBid = auction.hargaSaatIni + MIN_BID_INCREMENT;

    if (bidValue <= auction.hargaSaatIni) {
      setError(`Penawaran harus lebih tinggi dari Rp ${auction.hargaSaatIni.toLocaleString('id-ID')}`);
      return false;
    }

    if ((bidValue - auction.hargaSaatIni) % MIN_BID_INCREMENT !== 0) {
      setError(
        `Penawaran harus kelipatan Rp ${MIN_BID_INCREMENT.toLocaleString('id-ID')} dari harga saat ini`
      );
      return false;
    }

    if (bidValue < minBid) {
      setError(
        `Penawaran minimum adalah Rp ${minBid.toLocaleString('id-ID')}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateBid()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const bidValue = parseInt(bidAmount);
      console.log('Bid submitted:', {
        auctionId: auction.id,
        bidAmount: bidValue,
        timestamp: new Date().toISOString(),
      });

      setBidSuccess(true);
      onBidSuccess(bidValue);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Gagal mengirim penawaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minBidAmount = auction.hargaSaatIni + MIN_BID_INCREMENT;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auction-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          {/* Success Message */}
          {bidSuccess && (
            <div
              style={{
                background: '#d1fae5',
                color: '#065f46',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              ✓ Penawaran Anda diterima!
            </div>
          )}

          {/* Auction Title */}
          <div className="modal-title">{auction.namaBarang}</div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="modal-content">

        {/* Image Gallery */}
        {auction.images && auction.images.length > 0 ? (
          <div className="modal-section">
            <div style={{ marginBottom: '12px' }}>
              <img
                src={auction.images[selectedImageIndex]}
                alt={auction.namaBarang}
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
              />
              {auction.images.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
                  {auction.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${auction.namaBarang} - ${idx + 1}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      style={{
                        width: '100%',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: idx === selectedImageIndex ? '2px solid #667eea' : '1px solid #e0e0e0',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="modal-section" style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#999' }}>
            [No Images Available]
          </div>
        )}

        {/* Kategori & Kondisi */}
        <div className="modal-section">
          <div className="modal-section-title">📦 Kategori & Kondisi</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <div style={{ paddingLeft: '12px', borderLeft: '3px solid #0ea5e9' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Kategori</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>{auction.kategori}</div>
            </div>
            <div style={{ paddingLeft: '12px', borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Kondisi</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#22c55e' }}>✓ {auction.kondisi}</div>
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div className="modal-section">
          <div className="modal-section-title">📝 Deskripsi Barang</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', lineHeight: '1.6', marginTop: '12px' }}>
            {auction.deskripsi}
          </div>
        </div>

        {/* Harga Info */}
        <div className="modal-section">
          <div className="modal-section-title">💰 Informasi Harga & Peserta</div>
          <div className="price-box">
            <div className="price-item">
              <div className="price-label">Harga Saat Ini</div>
              <div className="price-value">
                Rp {auction.hargaSaatIni.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Harga Awal</div>
              <div className="price-value">
                Rp {auction.hargaReserve.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Sisa Waktu</div>
              <div className="price-value" style={{ color: '#f97316' }}>
                {auction.sisaWaktu}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Total Peserta</div>
              <div className="price-value" style={{ color: '#0ea5e9' }}>
                {auction.peserta} orang
              </div>
            </div>
          </div>
        </div>

        {/* Aturan Penawaran */}
        <div className="modal-section">
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.7' }}>
            <div style={{ fontWeight: '700', marginBottom: '8px', color: '#4b5563', fontSize: '13px' }}>
              ⚠️ Aturan Penawaran:
            </div>
            <ul style={{ marginLeft: '16px', listStyle: 'none' }}>
              <li>• Penawaran harus lebih tinggi dari harga saat ini</li>
              <li>• Penawaran harus kelipatan Rp 50.000</li>
              <li>• Penawaran tidak bisa dibatalkan setelah dikirim</li>
              <li>• Pemenang harus melunasi dalam 24 jam</li>
            </ul>
          </div>
        </div>

        {/* Info Penawaran */}
        <div className="modal-section">
          <div
            style={{
              fontSize: '13px',
              color: '#6b7280',
              padding: '12px 14px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              lineHeight: '1.6',
            }}
          >
            <div style={{ marginBottom: '6px', fontWeight: '600' }}>💡 Info Penawaran:</div>
            <div>• Minimum: Rp {minBidAmount.toLocaleString('id-ID')}</div>
            <div>• Kelipatan: Rp {MIN_BID_INCREMENT.toLocaleString('id-ID')}</div>
          </div>
        </div>

        </div>

        {/* Modal Footer - Penawaran Baru (Fixed) */}
        <div className="modal-footer">
          <div className="modal-section-title">🏷️ Penawaran Baru</div>
          <form className="bid-form" onSubmit={handleSubmit}>
            {/* Bid Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="bid-input-group">
                <div className="bid-prefix">Rp</div>
                <input
                  type="text"
                  className="bid-input"
                  value={formatCurrency(bidAmount)}
                  onChange={handleBidChange}
                  placeholder="Masukkan jumlah penawaran"
                  disabled={isSubmitting || bidSuccess}
                  inputMode="numeric"
                  style={{
                    textAlign: 'right',
                    fontWeight: '600',
                    fontSize: '16px',
                    color: bidAmount ? '#1f2937' : '#d1d5db',
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bid-error">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="bid-submit"
                disabled={isSubmitting || bidSuccess}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderRadius: '50%',
                        borderTopColor: 'transparent',
                        animation: 'spin 1s linear infinite',
                      }}
                    ></span>
                    Memproses...
                  </>
                ) : bidSuccess ? (
                  <>
                    <span>✓</span>
                    Berhasil Dikirim!
                  </>
                ) : (
                  <>
                    <span>💰</span>
                    Kirim Penawaran
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
