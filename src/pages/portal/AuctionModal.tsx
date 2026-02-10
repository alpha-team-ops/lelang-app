import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { PortalAuction } from '../../data/types';
import type { AccessLevel } from './utils/sessionManager';
import { bidService, auctionService } from '../../data/services';
import { useRealtimeAuction } from '../../hooks/useRealtimeAuction';
import { createEchoInstance } from '../../lib/websocket';
import Echo from 'laravel-echo';
import './styles/portal.css';

interface AuctionModalProps {
  auction: PortalAuction;
  onClose: () => void;
  onBidSuccess: (newPrice: number) => void;
  accessLevel?: AccessLevel;
}

export default function AuctionModal({ auction, onClose, onBidSuccess, accessLevel }: AuctionModalProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [liveAuction, setLiveAuction] = useState<PortalAuction>(auction);
  const [displayTimeRemaining, setDisplayTimeRemaining] = useState<string>('N/A');
  const [bidNotification, setBidNotification] = useState<{ bidderName: string; currentBid: number } | null>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const incrementedAuctionIdRef = useRef<string | null>(null);
  const echoRef = useRef<Echo<any> | null>(null);

  // Call recordView when modal opens to trigger broadcast from backend
  useEffect(() => {
    const recordView = async () => {
      try {
        // Use auctionService client which has correct base URL and auth
        await auctionService.incrementViewCount(auction.id);
      } catch (err) {
        // Silently fail
      }
    };
    
    recordView();
  }, [auction.id]);

  // Memoize callback - only update currentBid for bandwidth optimization
  const handleCurrentBidUpdate = useCallback((currentBid: number) => {
    setLiveAuction(prev => ({
      ...prev,
      currentBid: currentBid,
    }));
  }, []);

  // Try WebSocket first, fallback to polling - OPTIMIZED for currentBid only
  const { isConnected } = useRealtimeAuction({
    auctionId: auction.id,
    status: auction.status, // Use auction prop (not liveAuction which can be undefined initially)
    enabled: true,
    onCurrentBidUpdate: handleCurrentBidUpdate,
  });

  // Also sync with parent prop changes (from parent's polling)
  useEffect(() => {
    setLiveAuction(auction);
  }, [auction]);

  // Calculate time remaining from endTime
  const calculateTimeRemaining = (endTime: Date | string, status?: string): string => {
    // Don't show timer for DRAFT or CANCELLED auctions
    if (status === 'DRAFT' || status === 'CANCELLED') {
      return 'N/A';
    }

    const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
    const now = new Date();
    const diff = endTimeDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Timer effect - only update display for non-DRAFT auctions
  useEffect(() => {
    const currentAuction = liveAuction || auction;
    
    // For DRAFT/CANCELLED, show N/A and don't set interval
    if (currentAuction.status === 'DRAFT' || currentAuction.status === 'CANCELLED') {
      setDisplayTimeRemaining('N/A');
      return;
    }

    // Calculate initial value
    setDisplayTimeRemaining(calculateTimeRemaining(currentAuction.endTime, currentAuction.status));

    // Only setup interval for non-DRAFT auctions
    const timerInterval = setInterval(() => {
      const current = liveAuction || auction;
      setDisplayTimeRemaining(calculateTimeRemaining(current.endTime, current.status));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [liveAuction?.id, auction.id, liveAuction?.status, auction.status]);

  // Prevent body scroll when modal opens
  useEffect(() => {
    document.body.classList.add('modal-open');
    
    // Track view when modal opens - only increment ONCE per unique auctionId
    // Use useRef to track the last incremented ID, preventing re-increment on re-render
    if (auction?.id) {
      // Only increment if this is a NEW auction (different from last time)
      if (incrementedAuctionIdRef.current !== auction.id) {
        auctionService.incrementViewCount(auction.id).catch((_err) => {
        });
        // Update ref to current auctionId
        incrementedAuctionIdRef.current = auction.id;
      }
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [auction?.id]);

  // WebSocket setup for portal auction real-time updates
  useEffect(() => {
    if (!auction?.id) return;

    const setupWebSocket = () => {
      try {
        // Get portal token or invitation code for WebSocket auth
        const userToken = sessionStorage.getItem('portalToken');
        
        // Create Echo instance with portal token
        const echo = createEchoInstance(userToken);
        echoRef.current = echo;

        const channel = echo.channel(`auction.${auction.id}`);

        channel
          .listen('auction.updated', (data: any) => {
            // Update auction state with WebSocket data
            setLiveAuction((prev) => ({
              ...prev,
              currentBid: data.currentBid ?? prev.currentBid,
              status: data.status ?? prev.status,
              participantCount: data.participantCount ?? prev.participantCount,
            }));
          })
          .listen('auction.ended', (data: any) => {
            // Handle auction end
            setLiveAuction((prev) => ({
              ...prev,
              status: 'ENDED' as const,
              winner: data.winner || null,
            }));
          })
          .listen('bid.placed', (data: any) => {
            // Show bid notification
            setBidNotification({
              bidderName: data.bidderName || 'Unknown',
              currentBid: data.currentBid,
            });

            // Update current bid and participants
            setLiveAuction((prev) => ({
              ...prev,
              currentBid: data.currentBid,
              participantCount: data.participantCount ?? prev.participantCount,
            }));

            // Clear notification after 5 seconds
            setTimeout(() => setBidNotification(null), 5000);
          });
      } catch (err) {
        // WebSocket setup failed - polling fallback is in place
      }
    };

    setupWebSocket();

    // Cleanup
    return () => {
      if (echoRef.current) {
        echoRef.current.leaveChannel(`auction.${auction.id}`);
      }
    };
  }, [auction?.id]);

  // 🚀 Manual polling fallback for portal auctions - ensure updates even if WebSocket slow
  // Poll every 2 seconds to get latest price, participants, status
  useEffect(() => {
    let isPolling = false;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      pollingInterval = setInterval(async () => {
        if (isPolling) return; // Skip if already polling
        isPolling = true;

        try {
          const token = sessionStorage.getItem('portalToken');
          if (!token) {
            isPolling = false;
            return;
          }

          const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const url = `${apiUrl}/api/v1/auctions/${auction.id}`;
          
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
              setLiveAuction((prev) => ({
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

    if (auction.status === 'LIVE') {
      startPolling();
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [auction.id, auction.status]);

  const handleBidChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    // Extract only digits
    const digitsOnly = inputValue.replace(/\D/g, '');
    setBidAmount(digitsOnly);
    setError('');

    // Restore cursor position intelligently
    setTimeout(() => {
      if (bidInputRef.current) {
        const formatted = formatCurrency(digitsOnly);
        
        // Count how many digits existed before cursor in input
        let digitCount = 0;
        for (let i = 0; i < cursorPos && i < inputValue.length; i++) {
          if (/\d/.test(inputValue[i])) {
            digitCount++;
          }
        }
        
        // Find position in formatted string that corresponds to the same digit count
        let newCursorPos = 0;
        let digitsSeen = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            digitsSeen++;
            if (digitsSeen === digitCount) {
              newCursorPos = i + 1;
              break;
            }
          }
        }
        
        // If cursor was at end or beyond, place it at end
        if (digitCount === 0 || newCursorPos === 0) {
          newCursorPos = formatted.length;
        }
        
        bidInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const formatCurrency = (value: string): string => {
    if (!value) return '';
    return parseInt(value).toLocaleString('id-ID');
  };

  const validateBid = (): boolean => {
    const currentAuction = liveAuction || auction;
    
    if (currentAuction.status !== 'LIVE') {
      setError('This auction is not currently active.');
      return false;
    }

    if (!bidAmount) {
      setError('Please enter a bid amount');
      return false;
    }

    const bidValue = parseInt(bidAmount);
    const minBid = currentAuction.currentBid + currentAuction.bidIncrement;

    if (bidValue <= currentAuction.currentBid) {
      setError(`Bid must be higher than Rp ${currentAuction.currentBid.toLocaleString('id-ID')}`);
      return false;
    }

    if ((bidValue - currentAuction.currentBid) % currentAuction.bidIncrement !== 0) {
      setError(
        `Bid must be multiple of Rp ${currentAuction.bidIncrement.toLocaleString('id-ID')} from current price`
      );
      return false;
    }

    if (bidValue < minBid) {
      setError(
        `Minimum bid is Rp ${minBid.toLocaleString('id-ID')}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Prevent bid if VIEW_ONLY access
    if (accessLevel === 'VIEW_ONLY') {
      setError('You cannot place bids with view-only access. Please register to participate.');
      return;
    }

    if (!validateBid()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const bidValue = parseInt(bidAmount);
      const currentAuction = liveAuction || auction;
      
      // Call bidService to place bid using API spec
      await bidService.placeBid({
        auctionId: currentAuction.id,
        bidAmount: bidValue,
      });

      setBidSuccess(true);
      onBidSuccess(bidValue);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit bid. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const minBidAmount = (liveAuction || auction).currentBid + (liveAuction || auction).bidIncrement;

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
              ✓ Your bid has been submitted!
            </div>
          )}

          {/* WebSocket Bid Notification */}
          {bidNotification && (
            <div
              style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              💰 New bid from <strong>{bidNotification.bidderName}</strong>: Rp{' '}
              {bidNotification.currentBid.toLocaleString('id-ID')}
            </div>
          )}

          {/* Auction Title */}
          <div className="modal-title">{auction.title}</div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="modal-content">

        {/* Image Gallery */}
        {auction.images && auction.images.length > 0 ? (
          <div className="modal-section">
            <div style={{ marginBottom: '12px' }}>
              <img
                src={auction.images[selectedImageIndex]}
                alt={auction.title}
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
                      alt={`${auction.title} - ${idx + 1}`}
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

        {/* Category & Condition */}
        <div className="modal-section">
          <div className="modal-section-title">📦 Category & Condition</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <div style={{ paddingLeft: '12px', borderLeft: '3px solid #0ea5e9' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Category</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>{auction.category}</div>
            </div>
            <div style={{ paddingLeft: '12px', borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Condition</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#22c55e' }}>✓ {auction.condition}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="modal-section">
          <div className="modal-section-title">📝 Item Description</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', lineHeight: '1.6', marginTop: '12px' }}>
            {auction.description}
          </div>
        </div>

        {/* Price Info */}
        <div className="modal-section">
          <div className="modal-section-title">💰 Price & Participants Info</div>
          {/* Connection Status Badge */}
          <div style={{ 
            fontSize: '11px', 
            color: isConnected ? '#059669' : '#ea580c',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '12px' }}>
              {isConnected ? '🟢' : '🟡'} 
              {isConnected ? 'Real-time + Polling' : 'Polling updates'}
            </span>
          </div>
          <div className="price-box">
            <div className="price-item">
              <div className="price-label">Current Price</div>
              <div className="price-value">
                Rp {(liveAuction || auction).currentBid.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Starting Price</div>
              <div className="price-value">
                Rp {(liveAuction || auction).startingPrice ? (liveAuction || auction).startingPrice!.toLocaleString('id-ID') : '-'}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Time Remaining</div>
              <div className="price-value" style={{ 
                color: (liveAuction || auction).endTime && new Date((liveAuction || auction).endTime).getTime() - new Date().getTime() < 5 * 60 * 1000 ? '#dc2626' : '#f97316'
              }}>
                {displayTimeRemaining}
              </div>
            </div>
            <div className="price-item">
              <div className="price-label">Total Participants</div>
              <div className="price-value" style={{ color: '#0ea5e9' }}>
                {(liveAuction || auction).participantCount} people
              </div>
            </div>
          </div>
        </div>

        {/* Bidding Rules */}
        <div className="modal-section">
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.7' }}>
            <div style={{ fontWeight: '700', marginBottom: '8px', color: '#4b5563', fontSize: '13px' }}>
              ⚠️ Bidding Rules:
            </div>
            <ul style={{ marginLeft: '16px', listStyle: 'none' }}>
              <li>• Bid amount must be higher than current price</li>
              <li>• Bid must be multiple of Rp {(liveAuction || auction).bidIncrement.toLocaleString('id-ID')}</li>
              <li>• Bids cannot be canceled after submission</li>
              <li>• Winner must pay within 24 hours</li>
            </ul>
          </div>
        </div>

        {/* Bid Info */}
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
            <div style={{ marginBottom: '6px', fontWeight: '600' }}>💡 Bid Info:</div>
            <div>• Minimum: Rp {minBidAmount.toLocaleString('id-ID')}</div>
            <div>• Increment: Rp {(liveAuction || auction).bidIncrement.toLocaleString('id-ID')}</div>
          </div>
        </div>

        </div>

        {/* Modal Footer - New Bid (Fixed) */}
        <div className="modal-footer" style={accessLevel === 'VIEW_ONLY' ? { opacity: 0.6, backgroundColor: '#f5f5f5' } : {}}>
          <div className="modal-section-title">
            {accessLevel === 'VIEW_ONLY' ? '🔒 View Only' : '🏷️ New Bid'}
          </div>
          <form className="bid-form" onSubmit={handleSubmit} style={accessLevel === 'VIEW_ONLY' ? { pointerEvents: 'none' } : {}}>
            {/* Bid Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: accessLevel === 'VIEW_ONLY' ? 0.5 : 1 }}>
              <div className="bid-input-group">
                <div className="bid-prefix">Rp</div>
                <input
                  ref={bidInputRef}
                  type="text"
                  className="bid-input"
                  value={formatCurrency(bidAmount)}
                  onChange={handleBidChange}
                  placeholder={accessLevel === 'VIEW_ONLY' ? 'View only - cannot bid' : 'Enter bid amount'}
                  disabled={isSubmitting || bidSuccess || accessLevel === 'VIEW_ONLY'}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    textAlign: 'right',
                    fontWeight: '600',
                    fontSize: '16px',
                    color: bidAmount ? '#1f2937' : '#9ca3af',
                    transition: 'color 0.2s ease',
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
                disabled={isSubmitting || bidSuccess || auction.status !== 'LIVE' || accessLevel === 'VIEW_ONLY'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: accessLevel === 'VIEW_ONLY' ? '#d1d5db' : undefined,
                  color: accessLevel === 'VIEW_ONLY' ? '#666' : undefined,
                  cursor: accessLevel === 'VIEW_ONLY' ? 'not-allowed' : 'pointer',
                }}
              >
                {accessLevel === 'VIEW_ONLY' ? (
                  <>
                    <span>🔒</span>
                    View Only - Cannot Bid
                  </>
                ) : isSubmitting ? (
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
                    Processing...
                  </>
                ) : bidSuccess ? (
                  <>
                    <span>✓</span>
                    Bid Submitted!
                  </>
                ) : (
                  <>
                    <span>💰</span>
                    Submit Bid
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
