import { useState, useEffect, useMemo } from 'react';
import type { PortalAuction } from '../../../data/types';

interface AuctionTimerDisplayProps {
  auction: PortalAuction;
}

export default function AuctionTimerDisplay({ auction }: AuctionTimerDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('N/A');
  const [isEnded, setIsEnded] = useState(false);

  // Calculate time display
  const calculateTimeRemaining = useMemo(() => {
    return (endTime: Date | string, status?: string): [string, boolean] => {
      if (status === 'DRAFT' || status === 'CANCELLED') {
        return ['N/A', false];
      }

      const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
      const now = new Date();
      const diff = endTimeDate.getTime() - now.getTime();

      if (diff <= 0) return ['Ended', true];

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return [`${days}d ${hours}h ${minutes}m`, false];
      }
      return [`${hours}h ${minutes}m`, false];
    };
  }, []);

  // Timer effect - only update for non-DRAFT auctions
  useEffect(() => {
    // For DRAFT/CANCELLED, show N/A and don't setup interval
    if (auction.status === 'DRAFT' || auction.status === 'CANCELLED') {
      setTimeRemaining('N/A');
      setIsEnded(false);
      return;
    }

    // Calculate initial value
    const [time, ended] = calculateTimeRemaining(auction.endTime, auction.status);
    setTimeRemaining(time);
    setIsEnded(ended);

    // Setup interval to update timer every second
    const timerInterval = setInterval(() => {
      const [time, ended] = calculateTimeRemaining(auction.endTime, auction.status);
      setTimeRemaining(time);
      setIsEnded(ended);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [auction.id, auction.status, auction.endTime, calculateTimeRemaining]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      fontWeight: 600,
      color: isEnded ? '#ef4444' : '#666'
    }}>
      <span style={{
        fontSize: '16px'
      }}>
        {isEnded ? '⏰' : '⏱️'}
      </span>
      {timeRemaining}
    </div>
  );
}
