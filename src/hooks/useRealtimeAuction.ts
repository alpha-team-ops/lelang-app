import { useEffect, useState, useCallback, useRef } from 'react'
import { getEcho } from '../config/echo'
import type { Auction } from '../data/types'

interface UseRealtimeAuctionOptions {
  auctionId: string
  enabled?: boolean
  onBidPlaced?: (data: any) => void
  onAuctionUpdated?: (data: Auction) => void
  onAuctionEnded?: (data: any) => void
}

/**
 * Hook untuk subscribe ke real-time auction updates via WebSocket
 * Fallback ke polling jika WebSocket tidak tersedia
 */
export const useRealtimeAuction = ({
  auctionId,
  enabled = true,
  onBidPlaced,
  onAuctionUpdated,
  onAuctionEnded,
}: UseRealtimeAuctionOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Memoize callbacks to prevent dependency changes
  const memoizedOnBidPlaced = useCallback((data: any) => {
    onBidPlaced?.(data)
  }, [onBidPlaced])

  const memoizedOnAuctionUpdated = useCallback((data: Auction) => {
    onAuctionUpdated?.(data)
  }, [onAuctionUpdated])

  const memoizedOnAuctionEnded = useCallback((data: any) => {
    onAuctionEnded?.(data)
  }, [onAuctionEnded])

  const subscribeToAuction = useCallback(() => {
    if (!enabled || !auctionId) return

    try {
      const echo = getEcho()
      
      if (!echo) {
        throw new Error('Echo instance is null')
      }

      const channel = echo.channel(`auction.${auctionId}`)

      // Listen for new bid
      channel.listen('bid.placed', (data: any) => {
        memoizedOnBidPlaced(data)
      })

      // Listen for auction updated
      channel.listen('auction.updated', (data: Auction) => {
        memoizedOnAuctionUpdated(data)
      })

      // Listen for auction ended
      channel.listen('auction.ended', (data: any) => {
        memoizedOnAuctionEnded(data)
      })

      setIsConnected(true)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect WebSocket'
      setError(message)
      console.error('❌ WebSocket connection error:', message, err)
      setIsConnected(false)
    }
  }, [auctionId, enabled, memoizedOnBidPlaced, memoizedOnAuctionUpdated, memoizedOnAuctionEnded])

  useEffect(() => {
    subscribeToAuction()

    return () => {
      // Cleanup on unmount
      if (auctionId) {
        try {
          const echo = getEcho()
          echo.leaveChannel(`auction.${auctionId}`)
        } catch (err) {
          console.error('Error cleaning up WebSocket:', err)
        }
      }
    }
  }, [auctionId, subscribeToAuction])

  return { isConnected, error }
}

/**
 * Hook untuk polling fallback (ketika WebSocket tidak tersedia)
 */
export const useAuctionPolling = (
  auctionId: string,
  interval: number = 500,
  enabled: boolean = true,
  onUpdate?: (data: Auction) => void
) => {
  const [isPolling, setIsPolling] = useState(false)
  const onUpdateRef = useRef(onUpdate) // Store callback in ref to prevent re-runs
  const previousAuctionIdRef = useRef<string>('')

  // Update ref whenever callback changes (but doesn't trigger effects)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!enabled || !auctionId) return

    // If auctionId changed, still setup polling (don't skip)
    // But prevent unnecessary re-setups
    const auctionIdChanged = previousAuctionIdRef.current !== auctionId
    if (auctionIdChanged) {
      previousAuctionIdRef.current = auctionId
    }

    setIsPolling(true)
    
    const pollId = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const url = `${apiUrl}/api/v1/auctions/portal/${auctionId}`
        
        // Try portal token first, then admin token
        let token = sessionStorage.getItem('portalToken') || sessionStorage.getItem('authToken')
        
        // Also try admin accessToken as fallback
        if (!token) {
          token = localStorage.getItem('accessToken')
        }
        
        if (!token) {
          console.warn(`⚠️ No access token found for polling (checked: portalToken, authToken, accessToken)`)
          return
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
        
        if (response.ok) {
          const responseData = await response.json()
          
          if (responseData.data) {
            onUpdateRef.current?.(responseData.data)
          } else if (responseData.success === false) {
            console.warn(`⚠️ Polling error response:`, responseData.error)
          } else {
            console.warn(`⚠️ Polling response missing 'data' field:`, responseData)
          }
        } else {
          console.warn(`⚠️ Polling response not ok: ${response.status} ${response.statusText}`)
          const errorData = await response.json().catch(() => null)
          if (errorData) {
            console.warn(`   Error details:`, errorData)
          }
        }
      } catch (err) {
        console.error(`❌ Polling error:`, err)
      }
    }, interval)

    return () => {
      clearInterval(pollId)
      setIsPolling(false)
    }
  }, [auctionId, interval, enabled]) // ✅ Removed onUpdate from dependencies

  return { isPolling }
}
