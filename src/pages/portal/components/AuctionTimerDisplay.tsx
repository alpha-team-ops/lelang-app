import { useState, useEffect, useMemo } from 'react';
import type { PortalAuction } from '../../../data/types';

interface AuctionTimerDisplayProps {
  auction: PortalAuction;
}

export default function AuctionTimerDisplay({ auction }: AuctionTimerDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('N/A');

  // Calculate time display
  const calculateTimeRemaining = useMemo(() => {
    return (endTime: Date | string, status?: string): string => {
      if (status === 'DRAFT' || status === 'CANCELLED') {
        return 'N/A';
      }

      const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
      const now = new Date();
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
  }, []);

  // Timer effect - only update for non-DRAFT auctions
  useEffect(() => {
    // For DRAFT/CANCELLED, show N/A and don't setup interval
    if (auction.status === 'DRAFT' || auction.status === 'CANCELLED') {
      setTimeRemaining('N/A');
      return;
    }

    // Calculate initial value
    setTimeRemaining(calculateTimeRemaining(auction.endTime, auction.status));

    // Setup interval to update timer every second
    const timerInterval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(auction.endTime, auction.status));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [auction.id, auction.status, auction.endTime, calculateTimeRemaining]);

  return (
    <div className="auction-timer">
      <span className="auction-timer-icon">⏱️</span>
      {timeRemaining}
    </div>
  );
}
