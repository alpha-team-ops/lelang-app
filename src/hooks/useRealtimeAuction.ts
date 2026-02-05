import { useEffect, useState, useCallback, useRef } from 'react'
import { createEchoInstance } from '../lib/websocket'
import authService from '../data/services/authService'
import type { Auction } from '../data/types'

interface UseRealtimeAuctionOptions {
  auctionId: string
  status?: string // 'DRAFT' | 'LIVE' | 'ENDED' | 'SCHEDULED'
  enabled?: boolean
  onCurrentBidUpdate?: (currentBid: number, bidderName?: string) => void
  onAuctionUpdate?: (data: any) => void
  onAuctionEnded?: (data: any) => void
}

/**
 * Hook untuk subscribe ke real-time auction currentBid updates via WebSocket
 * OPTIMIZED: 
 * - Hanya track currentBid untuk minimize bandwidth
 * - Hanya subscribe ke LIVE auctions (DRAFT/ENDED tidak perlu)
 * - Auto-subscribe saat status berubah ke LIVE
 * Fallback ke polling jika WebSocket tidak tersedia
 */
export const useRealtimeAuction = ({
  auctionId,
  status,
  enabled = true,
  onCurrentBidUpdate,
  onAuctionUpdate,
  onAuctionEnded,
}: UseRealtimeAuctionOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Memoize callbacks to prevent dependency changes
  const memoizedOnCurrentBidUpdate = useCallback((currentBid: number, bidderName?: string) => {
    onCurrentBidUpdate?.(currentBid, bidderName)
  }, [onCurrentBidUpdate])

  const memoizedOnAuctionUpdate = useCallback((data: any) => {
    onAuctionUpdate?.(data)
  }, [onAuctionUpdate])

  const memoizedOnAuctionEnded = useCallback((data: any) => {
    onAuctionEnded?.(data)
  }, [onAuctionEnded])

  const subscribeToAuction = useCallback(() => {
    if (!enabled || !auctionId) return

    // ✅ Only subscribe to LIVE auctions
    // ❌ Skip DRAFT (no bids yet) and ENDED (auction closed)
    if (!status || status !== 'LIVE') {
      setIsConnected(false)
      return
    }

    try {
      // Get token for WebSocket authentication
      const token = authService.getStoredToken() || sessionStorage.getItem('portalToken')
      const echo = createEchoInstance(token)

      const channel = echo.channel(`auction.${auctionId}`)

      // Listen to auction.updated event (currentBid, status, viewCount changes)
      channel.listen('auction.updated', (data: any) => {
        memoizedOnAuctionUpdate(data)
        if (data.currentBid !== undefined) {
          memoizedOnCurrentBidUpdate(data.currentBid, data.bidderName)
        }
      })

      // Listen to bid.placed event (new bid submitted)
      channel.listen('bid.placed', (data: any) => {
        if (data.currentBid !== undefined) {
          memoizedOnCurrentBidUpdate(data.currentBid, data.bidderName)
        }
      })

      // Listen to auction.ended event (auction finished, show winner info)
      channel.listen('auction.ended', (data: any) => {
        memoizedOnAuctionEnded(data)
      })

      setIsConnected(true)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect WebSocket'
      setError(message)
      setIsConnected(false)
    }
  }, [auctionId, status, enabled, memoizedOnCurrentBidUpdate, memoizedOnAuctionUpdate, memoizedOnAuctionEnded])

  useEffect(() => {
    // Only subscribe if enabled
    if (enabled && auctionId) {
      subscribeToAuction()
    }

    return () => {
      // Always cleanup when disabled or auctionId changes
      if (auctionId) {
        try {
          const token = authService.getStoredToken() || sessionStorage.getItem('portalToken')
          const echo = createEchoInstance(token)
          echo.leaveChannel(`auction.${auctionId}`)
        } catch (err) {
          // Silently fail cleanup
        }
      }
    }
  }, [auctionId, status, enabled, subscribeToAuction, memoizedOnAuctionUpdate, memoizedOnAuctionEnded])

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

        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        
        // Use admin endpoint for DRAFT/SCHEDULED auctions, portal endpoint for LIVE/ENDED
        const isDraftAuction = auctionStatus === 'DRAFT' || auctionStatus === 'SCHEDULED'
        const endpoint = isDraftAuction ? 'api/v1/admin/auctions' : 'api/v1/auctions'
        let url = `${apiUrl}/${endpoint}/${auctionId}`
        
        // Add invitation_code for portal endpoints
        if (!isDraftAuction) {
          const invitationCode = localStorage.getItem('invitationCode')
          if (invitationCode) {
            url += `?invitation_code=${encodeURIComponent(invitationCode)}`
          }
        }
        
        // Try portal token first, then admin token
        let token = sessionStorage.getItem('portalToken') || sessionStorage.getItem('authToken')
        
        // Also try admin accessToken as fallback
        if (!token) {
          token = localStorage.getItem('accessToken')
        }
        
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
            onUpdateRef.current?.(responseData.data)
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
