import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUserSession, clearUserSession, getSessionRemainingTime, formatRemainingTime } from './utils/sessionManager';
import { auctionService } from '../../data/services';
import { portalAuctionsMock } from '../../data/mock/auctions';
import authService from '../../data/services/authService';
import { useRealtimeAuction } from '../../hooks/useRealtimeAuction';
import type { PortalAuction } from '../../data/types';
import AuctionModal from './AuctionModal';
import AuctionTimerDisplay from './components/AuctionTimerDisplay';
import './styles/portal.css';

// ✅ PortalAuctionCard - individual card with WebSocket + polling for real-time price updates
const PortalAuctionCard: React.FC<{
  auction: PortalAuction;
  onSelectAuction: (auction: PortalAuction) => void;
}> = ({ auction: initialAuction, onSelectAuction }) => {
  const [liveData, setLiveData] = useState<Partial<PortalAuction>>({});

  // Call recordView to trigger broadcast when card mounts
  useEffect(() => {
    const recordView = async () => {
      try {
        // Use auctionService client which has correct base URL and auth
        await auctionService.incrementViewCount(initialAuction.id);
      } catch (err) {
        // Silently fail
      }
    };
    
    recordView();
  }, [initialAuction.id]);

  // Memoize callback for bid updates
  const handleCurrentBidUpdate = useCallback((currentBid: number, bidderName?: string) => {
    setLiveData((prev) => ({
      ...prev,
      currentBid: currentBid,
      participantCount: (prev.participantCount || 0) + (bidderName ? 1 : 0),
    }));
  }, []);

  // Subscribe to WebSocket via useRealtimeAuction hook (handles bid.placed and auction.updated)
  useRealtimeAuction({
    auctionId: initialAuction.id,
    status: initialAuction.status,
    enabled: true,
    onCurrentBidUpdate: handleCurrentBidUpdate,
  });

  // 🚀 Manual polling for portal auctions (because useAuctionPolling is admin-only)
  // Poll every 2 seconds to ensure we get latest price, participants, etc.
  useEffect(() => {
    let isPolling = false;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      pollingInterval = setInterval(async () => {
        if (isPolling) return; // Skip if already polling
        isPolling = true;

        try {
          const token = sessionStorage.getItem('portalToken') || authService.getStoredToken();
          if (!token) {
            isPolling = false;
            return;
          }

          const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          // Use portal endpoint for portal auctions
          const url = `${apiUrl}/api/v1/auctions/${initialAuction.id}`;
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const responseData = await response.json();
            if (responseData.data) {
              setLiveData((prev) => ({
                ...prev,
                currentBid: responseData.data.currentBid ?? prev.currentBid,
                participantCount: responseData.data.participantCount ?? prev.participantCount,
                status: responseData.data.status ?? prev.status,
                endTime: responseData.data.endTime ?? prev.endTime,
                viewCount: responseData.data.viewCount ?? prev.viewCount,
              }));
            }
          }
        } catch (err) {
          // Silently fail polling
        } finally {
          isPolling = false;
        }
      }, 2000); // Poll every 2s for near-realtime updates
    };

    if (initialAuction.status === 'LIVE') {
      startPolling();
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [initialAuction.id, initialAuction.status]);

  const displayAuction = { ...initialAuction, ...liveData };

  return (
    <div className="auction-card">
      {/* Image */}
      <div className="auction-image">
        {displayAuction.images && displayAuction.images.length > 0 ? (
          <img 
            src={displayAuction.images[0]} 
            alt={displayAuction.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div className="auction-image-placeholder">📦</div>
        )}
        <div className="auction-category-badge">{displayAuction.category}</div>
      </div>

      {/* Content */}
      <div className="auction-content">
        {/* Name & Condition */}
        <div className="auction-name">{displayAuction.title}</div>
        <div className="auction-condition">{displayAuction.condition}</div>

        {/* Price & Participants */}
        <div className="auction-info">
          <div className="info-item">
            <div className="info-label">Current Price</div>
            <div className="info-value price">
              Rp {displayAuction.currentBid.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Participants</div>
            <div className="info-value participants">{displayAuction.participantCount} people</div>
          </div>
        </div>

        {/* Timer */}
        <AuctionTimerDisplay auction={displayAuction} />

        {/* Bid Button */}
        <button
          className="auction-button"
          onClick={() => onSelectAuction(displayAuction)}
        >
          💰 Place Bid
        </button>
      </div>
    </div>
  );
};

export default function AuctionList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedAuction, setSelectedAuction] = useState<PortalAuction | null>(null);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const [auctions, setAuctions] = useState<PortalAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const userSession = getUserSession();
  // Extract invitation code from URL query params or localStorage
  const urlInvitationCode = searchParams.get('invitationCode');
  const storedInvitationCode = localStorage.getItem('invitationCode');
  const invitationCode = urlInvitationCode || storedInvitationCode || undefined;

  // Protect route: redirect to /portal if no valid session
  useEffect(() => {
    if (!userSession) {
      navigate('/portal');
    }
  }, [userSession, navigate]);

  // Save invitation code to localStorage if from URL
  useEffect(() => {
    if (urlInvitationCode) {
      localStorage.setItem('invitationCode', urlInvitationCode);
    }
  }, [urlInvitationCode]);

  // Load auctions from service
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call API endpoint with pagination and invitation code
        // Note: invitation code will be added by portalClient interceptor from localStorage
        const response = await auctionService.getAllPortalAuctions(page, 10, undefined, invitationCode || undefined);
        setAuctions(response.auctions);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load auctions';
        setError(errorMsg);
        // Fallback to mock data if error
        setAuctions(portalAuctionsMock);
      } finally {
        setLoading(false);
      }
    };

    loadAuctions();
  }, [page, invitationCode]);

  // Real-time polling for auctions - update all auctions every 2 seconds
  // (not 500ms to avoid overwhelming backend and race conditions)
  useEffect(() => {
    let isPolling = false; // Prevent overlapping requests
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    
    const startPolling = () => {
      pollingInterval = setInterval(async () => {
        if (isPolling) return; // Skip if previous poll still running
        
        // Check if user session is still valid
        const currentSession = getUserSession();
        if (!currentSession) {
          // Session expired, stop polling and redirect
          if (pollingInterval) clearInterval(pollingInterval);
          navigate('/portal');
          return;
        }
        
        isPolling = true;
        try {
          const response = await auctionService.getAllPortalAuctions(page, 10, undefined, invitationCode || undefined);
          setAuctions(response.auctions);
        } catch (err) {
          // Silently ignore polling errors to avoid noise
        } finally {
          isPolling = false;
        }
      }, 2000); // Poll every 2 seconds - more reasonable for backend response time
    };

    // Only start polling if user is authenticated
    if (userSession) {
      startPolling();
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [page, invitationCode, userSession, navigate]);

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
    localStorage.removeItem('invitationCode');
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
          <PortalAuctionCard 
            key={auction.id}
            auction={auction}
            onSelectAuction={setSelectedAuction}
          />
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
