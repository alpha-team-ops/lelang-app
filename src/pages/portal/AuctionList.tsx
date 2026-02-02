import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSession, clearUserSession, getSessionRemainingTime, formatRemainingTime } from './utils/sessionManager';
import { auctionService } from '../../data/services';
import { portalAuctionsMock } from '../../data/mock/auctions';
import type { PortalAuction } from '../../data/types';
import AuctionModal from './AuctionModal';
import './styles/portal.css';

// Helper to calculate time remaining from endTime
const calculateTimeRemaining = (endTime: Date | string): string => {
  const now = new Date();
  const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const diff = endTimeDate.getTime() - now.getTime();

  if (diff <= 0) return 'Sudah Berakhir';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
};

export default function AuctionList() {
  const navigate = useNavigate();
  const [selectedAuction, setSelectedAuction] = useState<PortalAuction | null>(null);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [auctions, setAuctions] = useState<PortalAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const userSession = getUserSession();

  // Load auctions from service
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        // Call API endpoint with pagination
        const response = await auctionService.getAllPortalAuctions(page, 10);
        setAuctions(response.auctions);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load auctions';
        setError(errorMsg);
        console.error('Error loading auctions:', err);
        // Fallback to mock data if error
        setAuctions(portalAuctionsMock);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, [page]);

  // Real-time polling for auctions - update all auctions every 2 seconds
  // (not 500ms to avoid overwhelming backend and race conditions)
  useEffect(() => {
    let isPolling = false; // Prevent overlapping requests
    const pollingInterval = setInterval(async () => {
      if (isPolling) return; // Skip if previous poll still running
      
      isPolling = true;
      try {
        const response = await auctionService.getAllPortalAuctions(page, 10);
        setAuctions(response.auctions);
      } catch (err) {
        // Silently ignore polling errors to avoid noise
        // console.error('Error polling auctions:', err);
      } finally {
        isPolling = false;
      }
    }, 2000); // Poll every 2 seconds - more reasonable for backend response time

    return () => clearInterval(pollingInterval);
  }, [page]);

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

  const handleBidSuccess = useCallback((auctionId: string, newPrice: number) => {
    setAuctions((prev) =>
      prev.map((auction) =>
        auction.id === auctionId
          ? {
              ...auction,
              currentBid: newPrice,
              participantCount: auction.participantCount + 1,
            }
          : auction
      )
    );
    setSelectedAuction(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedAuction(null);
  }, []);

  // Handler for bid success - use functional state update to avoid selectedAuction dependency
  const handleOnBidSuccess = useCallback((newPrice: number) => {
    setSelectedAuction(prev => {
      if (prev) {
        handleBidSuccess(prev.id, newPrice);
      }
      return null; // Close modal after bid success
    });
  }, [handleBidSuccess]);

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
            👤 {userSession?.fullName || 'User'}
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
              {auction.images && auction.images.length > 0 ? (
                <img 
                  src={auction.images[0]} 
                  alt={auction.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div className="auction-image-placeholder">📦</div>
              )}
              <div className="auction-category-badge">{auction.category}</div>
            </div>

            {/* Content */}
            <div className="auction-content">
              {/* Name & Condition */}
              <div className="auction-name">{auction.title}</div>
              <div className="auction-condition">{auction.condition}</div>

              {/* Price & Participants */}
              <div className="auction-info">
                <div className="info-item">
                  <div className="info-label">Current Price</div>
                  <div className="info-value price">
                    Rp {auction.currentBid.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Participants</div>
                  <div className="info-value participants">{auction.participantCount} people</div>
                </div>
              </div>

              {/* Timer */}
              <div className="auction-timer">
                <span className="auction-timer-icon">⏱️</span>
                {calculateTimeRemaining(auction.endTime)}
              </div>

              {/* Bid Button */}
              <button
                className="auction-button"
                onClick={() => setSelectedAuction(auction)}
              >
                💰 Place Bid
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', marginBottom: '32px' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
              backgroundColor: '#fff',
            }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 12px',
                border: p === page ? '2px solid #667eea' : '1px solid #e0e0e0',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: p === page ? '#667eea' : '#fff',
                color: p === page ? '#fff' : '#000',
                fontWeight: p === page ? 'bold' : 'normal',
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
              backgroundColor: '#fff',
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Auction Modal */}
      {selectedAuction && (
        <AuctionModal
          key={selectedAuction.id} // Use ID as key to prevent re-mounts on data changes
          auction={selectedAuction}
          onClose={handleCloseModal}
          onBidSuccess={handleOnBidSuccess}
        />
      )}
    </div>
  );
}
