import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession, getSessionRemainingTime, formatRemainingTime } from './utils/sessionManager';
import { auctionService } from '../../data/services';
import type { PortalAuction } from '../../data/types';
import AuctionModal from './AuctionModal';
import './styles/portal.css';

const dummyAuctions: PortalAuction[] = [
  {
    id: '1',
    namaBarang: 'Laptop ASUS ROG Gaming',
    kategori: 'Elektronik',
    kondisi: 'Bekas - Sangat Baik',
    hargaSaatIni: 8500000,
    hargaReserve: 7500000,
    sisaWaktu: '2h 45m 30s',
    peserta: 12,
    deskripsi: 'Laptop gaming performance tinggi, 15.6" FHD 144Hz, RTX 4080, RAM 32GB',
    gambar: '💻',
  },
  {
    id: '2',
    namaBarang: 'iPhone 14 Pro Max 256GB',
    kategori: 'Smartphone',
    kondisi: 'Bekas - Seperti Baru',
    hargaSaatIni: 12000000,
    hargaReserve: 11500000,
    sisaWaktu: '4h 20m 15s',
    peserta: 28,
    deskripsi: 'Dalam kondisi sempurna, lengkap dengan box dan aksesori original',
    gambar: '📱',
  },
  {
    id: '3',
    namaBarang: 'Canon EOS R5 Mirrorless',
    kategori: 'Kamera',
    kondisi: 'Bekas - Baik',
    hargaSaatIni: 18000000,
    hargaReserve: 16500000,
    sisaWaktu: '1h 15m 45s',
    peserta: 8,
    deskripsi: 'Kamera profesional 45MP, 8K video recording, AF canggih',
    gambar: '📷',
  },
  {
    id: '4',
    namaBarang: 'Apple Watch Series 8',
    kategori: 'Wearable',
    kondisi: 'Bekas - Sangat Baik',
    hargaSaatIni: 4500000,
    hargaReserve: 4000000,
    sisaWaktu: '6h 30m 00s',
    peserta: 15,
    deskripsi: '41mm Midnight, semua fitur berfungsi dengan baik',
    gambar: '⌚',
  },
  {
    id: '5',
    namaBarang: 'iPad Pro 12.9" M2',
    kategori: 'Tablet',
    kondisi: 'Bekas - Sangat Baik',
    hargaSaatIni: 9000000,
    hargaReserve: 8200000,
    sisaWaktu: '3h 50m 20s',
    peserta: 10,
    deskripsi: '256GB storage, Magic Keyboard included, baterai masih bagus',
    gambar: '📊',
  },
  {
    id: '6',
    namaBarang: 'Sony WH-1000XM5 Headphones',
    kategori: 'Audio',
    kondisi: 'Bekas - Seperti Baru',
    hargaSaatIni: 3500000,
    hargaReserve: 3000000,
    sisaWaktu: '12h 00m 00s',
    peserta: 20,
    deskripsi: 'Premium noise-cancelling headphones, koleksi pribadi',
    gambar: '🎧',
  },
];

export default function AuctionList() {
  const navigate = useNavigate();
  const [selectedAuction, setSelectedAuction] = useState<PortalAuction | null>(null);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [auctions, setAuctions] = useState<PortalAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userSession = getUserSession();

  // Load auctions from service
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await auctionService.getAllPortalAuctions();
        setAuctions(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load auctions';
        setError(errorMsg);
        console.error('Error loading auctions:', err);
        // Fallback to dummy data if error
        setAuctions(dummyAuctions);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, []);

  // Session timer
  useEffect(() => {
    // Check if user is authenticated
    if (!userSession) {
      navigate('/portal');
      return;
    }

    // Update session timer every second
    const interval = setInterval(() => {
      const remaining = getSessionRemainingTime();
      setSessionTime(remaining);

      // Auto logout if session expired
      if (remaining <= 0) {
        clearUserSession();
        navigate('/portal');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userSession, navigate]);

  const handleLogout = () => {
    clearUserSession();
    navigate('/portal');
  };

  const handleBidSuccess = (auctionId: string, newPrice: number) => {
    setAuctions((prev) =>
      prev.map((auction) =>
        auction.id === auctionId
          ? {
              ...auction,
              hargaSaatIni: newPrice,
              peserta: auction.peserta + 1,
            }
          : auction
      )
    );
    setSelectedAuction(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="auction-container">
        <div className="auction-header">
          <div className="auction-title-section">
            <h1>🏛️ Portal Lelang</h1>
            <p>Loading lelang...</p>
          </div>
        </div>
        <div className="auction-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="auction-card" style={{ opacity: 0.6 }}>
              <div className="auction-image">
                <div className="auction-image-placeholder">⏳</div>
              </div>
              <div className="auction-content">
                <div className="auction-name">Loading...</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="auction-container">
        <div className="auction-header">
          <div className="auction-title-section">
            <h1>🏛️ Portal Lelang</h1>
            <p style={{ color: '#dc2626' }}>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-container">
      {/* Header */}
      <div className="auction-header">
        <div className="auction-title-section">
          <h1>🏛️ Portal Lelang</h1>
          <p>Temukan dan menangkan barang pilihan Anda</p>
        </div>
        <div className="user-info">
          <div className="user-badge">
            👤 {userSession?.namaLengkap || 'User'}
          </div>
          <div
            className="user-badge"
            style={{
              background: sessionTime < 60000 ? '#fee2e2' : '#f0fdf4',
              color: sessionTime < 60000 ? '#991b1b' : '#166534',
            }}
          >
            ⏱️ {formatRemainingTime(sessionTime)}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Auction Grid */}
      <div className="auction-grid">
        {auctions.map((auction) => (
          <div key={auction.id} className="auction-card">
            {/* Image */}
            <div className="auction-image">
              <div className="auction-image-placeholder">{auction.gambar}</div>
              <div className="auction-category-badge">{auction.kategori}</div>
            </div>

            {/* Content */}
            <div className="auction-content">
              {/* Name & Condition */}
              <div className="auction-name">{auction.namaBarang}</div>
              <div className="auction-condition">{auction.kondisi}</div>

              {/* Price & Participants */}
              <div className="auction-info">
                <div className="info-item">
                  <div className="info-label">Harga Saat Ini</div>
                  <div className="info-value price">
                    Rp {auction.hargaSaatIni.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Peserta</div>
                  <div className="info-value participants">{auction.peserta} orang</div>
                </div>
              </div>

              {/* Timer */}
              <div className="auction-timer">
                <span className="auction-timer-icon">⏱️</span>
                {auction.sisaWaktu}
              </div>

              {/* Bid Button */}
              <button
                className="auction-button"
                onClick={() => setSelectedAuction(auction)}
              >
                💰 Lakukan Penawaran
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (shown if no auctions) */}
      {auctions.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📭</span>
          <div className="empty-state-title">Tidak ada lelang tersedia</div>
          <div className="empty-state-text">
            Silakan kembali nanti untuk melihat lelang baru
          </div>
        </div>
      )}

      {/* Auction Modal */}
      {selectedAuction && (
        <AuctionModal
          auction={selectedAuction}
          onClose={() => setSelectedAuction(null)}
          onBidSuccess={(newPrice: number) => handleBidSuccess(selectedAuction.id, newPrice)}
        />
      )}
    </div>
  );
}
