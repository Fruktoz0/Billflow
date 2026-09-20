import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) {
    return null;
  }

  if (showBackOnline) {
    return (
      <div className="bg-paid text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm">
        <Wifi className="w-3.5 h-3.5" />
        <span>Újra online – a kapcsolat helyreállt.</span>
      </div>
    );
  }

  return (
    <div className="bg-overdue text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm">
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Nincs kapcsolat, az utolsó mentett állapotot látod.</span>
    </div>
  );
};
