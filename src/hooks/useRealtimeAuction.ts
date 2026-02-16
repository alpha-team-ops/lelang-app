import { useEffect, useState, useCallback, useRef } from 'react'
import { getEchoInstance } from '../lib/websocket'
import authService from '../data/services/authService'
import type { Auction } from '../data/types'
import type {
  BidPlacedPayload,
  AuctionUpdatedPayload,
  AuctionEndedPayload,
} from '../types/websocket'

interface UseRealtimeAuctionOptions {
  auctionId: string
  status?: string // 'DRAFT' | 'LIVE' | 'ENDED' | 'SCHEDULED'
  enabled?: boolean
  onCurrentBidUpdate?: (currentBid: number, bidderName?: string) => void
  onAuctionUpdate?: (data: AuctionUpdatedPayload) => void
  onAuctionEnded?: (data: AuctionEndedPayload) => void
  onBidPlaced?: (data: BidPlacedPayload) => void
}

/**
 * Hook untuk subscribe ke real-time auction updates via WebSocket (Laravel Echo + Reverb)
 * 
 * EVENTS:
 * - bid.placed: Ketika ada bid baru (currentBid update)
 * - auction.updated: Ketika ada update ke auction (status, viewCount, dll)
 * - auction.ended: Ketika auction berakhir dan ada winner
 * 
 * OPTIMIZATION:
 * - Hanya subscribe ke LIVE/SCHEDULED auctions (DRAFT/ENDED tidak perlu)
 * - Auto-subscribe saat status berubah ke LIVE
 * - Auto-cleanup saat status berubah dari LIVE
 * 
 * USAGE:
 * ```tsx
 * const { isConnected, error } = useRealtimeAuction({
 *   auctionId: "auction-123",
 *   status: "LIVE",
 *   onCurrentBidUpdate: (bid, bidder) => updateUI(bid, bidder),
 *   onAuctionEnded: (data) => showWinnerModal(data),
 * });
 * ```
 */
export const useRealtimeAuction = ({
  auctionId,
  status,
  enabled = true,
  onCurrentBidUpdate,
  onAuctionUpdate,
  onAuctionEnded,
  onBidPlaced,
}: UseRealtimeAuctionOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const echoInstanceRef = useRef<any>(null)
  
  // Memoize callbacks to prevent unnecessary re-subscriptions
  const memoizedOnCurrentBidUpdate = useCallback((currentBid: number, bidderName?: string) => {
    onCurrentBidUpdate?.(currentBid, bidderName)
  }, [onCurrentBidUpdate])

  const memoizedOnAuctionUpdate = useCallback((data: AuctionUpdatedPayload) => {
    onAuctionUpdate?.(data)
  }, [onAuctionUpdate])

  const memoizedOnAuctionEnded = useCallback((data: AuctionEndedPayload) => {
    onAuctionEnded?.(data)
  }, [onAuctionEnded])

  const memoizedOnBidPlaced = useCallback((data: BidPlacedPayload) => {
    onBidPlaced?.(data)
  }, [onBidPlaced])

  const subscribeToAuction = useCallback(() => {
    console.log(`📢 [subscribeToAuction] Called for auction: ${auctionId}, status: ${status}, enabled: ${enabled}`)
    
    if (!enabled || !auctionId) {
      console.log(`⏸️ [subscribeToAuction] Skipped: enabled=${enabled}, auctionId=${auctionId}`)
      return
    }

    // ✅ Subscribe ke LIVE dan SCHEDULED (to catch status transitions)
    // ❌ Skip DRAFT (no real-time activity) dan ENDED (auction closed)
    if (!status || (status !== 'LIVE' && status !== 'SCHEDULED')) {
      console.log(`⏸️ [subscribeToAuction] Skipped: status not LIVE/SCHEDULED (${status})`)
      setIsConnected(false)
      return
    }

    console.log(`🔗 [subscribeToAuction] Subscribing to channel: auctions...`)
    try {
      // Get global Echo instance (singleton - created once, reused forever)
      const token = authService.getStoredToken() || sessionStorage.getItem('portalToken')
      const echo = getEchoInstance(token)
      echoInstanceRef.current = echo

      const channel = echo.channel(`auctions`)
      
      console.log(`📡 [subscribeToAuction] Listeners registered for WebSocket events`)
      console.log(`📡 [DEBUG] Watching channel: auctions with auctionId filter: ${auctionId}`)

      /**
       * EVENT: AuctionUpdated
       * Triggered ketika ada update auction
       */
      channel.listen('AuctionUpdated', (data: any) => {
        console.log(`🔵 [WS] AuctionUpdated received:`, data)
        // Filter hanya untuk auction ini
        if (data.auctionId === auctionId) {
          memoizedOnAuctionUpdate(data)
          if (data.currentBid !== undefined) {
            memoizedOnCurrentBidUpdate(data.currentBid, data.bidderName)
          }
        } else {
          console.log(`📡 [DEBUG] Event received but auctionId mismatch:`, { eventId: data.auctionId, expectedId: auctionId })
        }
      })

      // Catch-all listener untuk debug - tangkap SEMUA event
      channel.bind_global((eventName: string, data: any) => {
        console.log(`🔊 [DEBUG] Channel event received:`, eventName, data)
      })

      setIsConnected(true)
      setError(null)
      console.log(`✅ [WS] Connected to auctions channel for auction.${auctionId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect WebSocket'
      console.error('❌ WebSocket subscription error:', message)
      setError(message)
      setIsConnected(false)
    }
  }, [auctionId, status, enabled, memoizedOnCurrentBidUpdate, memoizedOnAuctionUpdate, memoizedOnAuctionEnded, memoizedOnBidPlaced])

  useEffect(() => {
    // Only subscribe if enabled
    if (enabled && auctionId) {
      subscribeToAuction()
    }

    return () => {
      // Cleanup: leave channel when disabled or auctionId changes
      if (auctionId && echoInstanceRef.current) {
        try {
          echoInstanceRef.current.leaveChannel(`auction.${auctionId}`)
        } catch (err) {
          // Silently fail cleanup
        }
      }
    }
  }, [auctionId, status, enabled, subscribeToAuction])

  return { isConnected, error }
}

/**
 * Hook untuk polling fallback (ketika WebSocket tidak tersedia)
 * Supports both portal (public/live) and admin (draft) auction endpoints
 */
export const useAuctionPolling = (
  auctionId: string,
  interval: number = 500,
  enabled: boolean = true,
  onUpdate?: (data: Auction) => void,
  auctionStatus?: string // 'DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', etc
) => {
  const [isPolling, setIsPolling] = useState(false)
  const onUpdateRef = useRef(onUpdate)
  const previousAuctionIdRef = useRef<string>('')
  const failureCountRef = useRef(0)
  const hasLoggedAuctionNotFoundRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reset logging flag when auctionId changes
  useEffect(() => {
    hasLoggedAuctionNotFoundRef.current = false
    failureCountRef.current = 0
  }, [auctionId])

  // Update ref whenever callback changes (but doesn't trigger effects)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!enabled || !auctionId) {
      setIsPolling(false)
      return
    }

    // Validate auctionId format (basic UUID check)
    if (!isValidUUID(auctionId)) {
      console.warn(`⚠️ Invalid auction ID format: ${auctionId}`)
      setIsPolling(false)
      return
    }

    // If auctionId changed, reset failure tracking
    const auctionIdChanged = previousAuctionIdRef.current !== auctionId
    if (auctionIdChanged) {
      previousAuctionIdRef.current = auctionId
      failureCountRef.current = 0
      hasLoggedAuctionNotFoundRef.current = false
    }

    setIsPolling(true)
    
    // Create new AbortController for this polling session
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    const pollId = setInterval(async () => {
      try {
        // Check if this polling session was aborted
        if (signal.aborted) {
          return
        }

        const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        
        // ✅ ALWAYS use admin endpoint - both admin and portal pages use this hook
        // Admin pages (GalleryPage, TablePage) use it for LIVE auctions
        // Portal pages don't use polling (only WebSocket via useRealtimeAuction)
        const endpoint = 'api/v1/admin/auctions'
        const url = `${apiUrl}/${endpoint}/${auctionId}`
        
        // ✅ Use admin token (accessToken from localStorage)
        // Admin pages always authenticate with Bearer token, never invitation_code
        let token = localStorage.getItem('accessToken')
        
        if (!token) {
          if (failureCountRef.current === 0) {
            console.warn(`⚠️ No access token found for polling (checked: portalToken, authToken, accessToken)`)
          }
          failureCountRef.current++
          // Stop after 3 consecutive failures without token
          if (failureCountRef.current >= 3) {
            console.warn(`⚠️ Stopping poll after ${failureCountRef.current} auth failures`)
            clearInterval(pollId)
            setIsPolling(false)
          }
          return
        }
        
        // Reset failure count on successful auth
        if (failureCountRef.current > 0) {
          failureCountRef.current = 0
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: signal, // Add AbortSignal here
        })
        
        if (response.ok) {
          const responseData = await response.json()
          
          if (responseData.data) {
            // Success - reset error state
            hasLoggedAuctionNotFoundRef.current = false
            const pollData = responseData.data
            console.log(`📡 [POLL] tick @ ${timestamp}`, { status: pollData.status, price: pollData.currentBid, views: pollData.viewCount })
            onUpdateRef.current?.(pollData)
          } else if (responseData.success === false) {
            // Check if auction not found
            if (responseData.message === 'AUCTION_NOT_FOUND') {
              if (!hasLoggedAuctionNotFoundRef.current) {
                console.warn(`⚠️ Auction not found: ${auctionId}`)
                hasLoggedAuctionNotFoundRef.current = true
              }
              // Continue polling in case auction is created later
            } else {
              if (failureCountRef.current === 0) {
                console.warn(`⚠️ Polling error response:`, responseData.message)
              }
              failureCountRef.current++
            }
          } else {
            if (failureCountRef.current === 0) {
              console.warn(`⚠️ Polling response missing expected structure:`, responseData)
            }
            failureCountRef.current++
          }
        } else if (response.status === 404) {
          // Auction not found - don't log repeatedly
          if (!hasLoggedAuctionNotFoundRef.current) {
            console.warn(`⚠️ Auction endpoint returned 404: ${auctionId}`)
            hasLoggedAuctionNotFoundRef.current = true
          }
          // Track consecutive 404s
          failureCountRef.current++
          
          // Stop polling after 10 consecutive 404s to avoid wasting resources
          if (failureCountRef.current >= 10) {
            console.warn(`⚠️ Stopping poll - auction not found after ${failureCountRef.current} attempts`)
            clearInterval(pollId)
            setIsPolling(false)
          }
        } else {
          if (failureCountRef.current === 0) {
            console.warn(`⚠️ Polling response not ok: ${response.status} ${response.statusText}`)
          }
          failureCountRef.current++
          
          // Stop polling after too many failures
          if (failureCountRef.current >= 5) {
            console.warn(`⚠️ Stopping poll after ${failureCountRef.current} consecutive failures`)
            clearInterval(pollId)
            setIsPolling(false)
          }
        }
      } catch (err: any) {
        // Ignore AbortError (expected when cleanup aborts pending requests)
        if (err?.name === 'AbortError') {
          return
        }
        
        failureCountRef.current++
        if (failureCountRef.current === 1) {
          console.error(`❌ Polling error:`, err)
        }
        
        // Stop polling after too many errors
        if (failureCountRef.current >= 5) {
          console.error(`❌ Stopping poll after ${failureCountRef.current} consecutive errors`)
          clearInterval(pollId)
          setIsPolling(false)
        }
      }
    }, interval)

    return () => {
      clearInterval(pollId)
      
      // Abort pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      setIsPolling(false)
    }
  }, [auctionId, interval, enabled, auctionStatus])

  return { isPolling }
}

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
