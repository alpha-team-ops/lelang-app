import { useState } from 'react';
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

        {/* Image Gallery */}
        {auction.images && auction.images.length > 0 ? (
          <div className="modal-section">
            <div style={{ marginBottom: '12px' }}>
              <img
                src={auction.images[selectedImageIndex]}
                alt={auction.namaBarang}
                style={{
                  width: '100%',
                  height: '200px',
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
          <div className="modal-section-title">Kategori & Kondisi</div>
          <div className="modal-section-content">
            <div style={{ marginBottom: '8px' }}>
              📦 {auction.kategori}
            </div>
            <div style={{ color: '#22c55e', fontWeight: '700' }}>
              ✓ {auction.kondisi}
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div className="modal-section">
          <div className="modal-section-title">Deskripsi Barang</div>
          <div className="modal-section-content" style={{ fontSize: '14px', fontWeight: '500' }}>
            {auction.deskripsi}
          </div>
        </div>

        {/* Harga Info */}
        <div className="modal-section">
          <div className="modal-section-title">Informasi Harga</div>
          <div className="price-box">
            <div className="price-item">
              <div className="price-label">Harga Saat Ini</div>
              <div className="price-value">
                Rp {auction.hargaSaatIni.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Harga Reserve</div>
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

        {/* Bid Form */}
        <div className="modal-section">
          <div className="modal-section-title">Penawaran Baru</div>
          <form className="bid-form" onSubmit={handleSubmit}>
            {/* Bid Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="bid-input-group">
                <div className="bid-prefix">Rp</div>
                <input
                  type="text"
                  className="bid-input"
                  value={formatCurrency(bidAmount)}
                  onChange={handleBidChange}
                  placeholder="0"
                  disabled={isSubmitting || bidSuccess}
                  inputMode="numeric"
                  style={{
                    textAlign: 'right',
                    fontWeight: '600',
                    fontSize: '16px',
                  }}
                />
              </div>

              {/* Bid Info */}
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  padding: '8px 0',
                  lineHeight: '1.6',
                }}
              >
                <div>
                  • Minimum penawaran: Rp {minBidAmount.toLocaleString('id-ID')}
                </div>
                <div>
                  • Kelipatan: Rp {MIN_BID_INCREMENT.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Error Message */}
              {error && <div className="bid-error">❌ {error}</div>}

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
                    Berhasil!
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

        {/* Rules */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: '1.6',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#4b5563' }}>
            Aturan Penawaran:
          </div>
          <ul style={{ marginLeft: '16px', listStyle: 'none' }}>
            <li>• Penawaran harus lebih tinggi dari harga saat ini</li>
            <li>• Penawaran harus kelipatan Rp 50.000</li>
            <li>• Penawaran tidak bisa dibatalkan setelah dikirim</li>
            <li>• Pemenang lelang harus menyelesaikan pembayaran dalam 24 jam</li>
          </ul>
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
