// ─────────────────────────────────────────────
// PINTEREST EMBED COMPONENT
// Fully embedded Pinterest profile/boards
// ─────────────────────────────────────────────
import { useEffect, useRef } from 'react';

interface PinterestEmbedProps {
  profileUrl: string;
  boardName?: string;
  width?: string;
  height?: string;
}

export function PinterestEmbed({ 
  profileUrl, 
  boardName,
  width = '100%',
  height = '600px'
}: PinterestEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Pinterest embed script if not already loaded
    if (!(window as any).PinUtils) {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = '//assets.pinterest.com/js/pinit.js';
      document.body.appendChild(script);
    } else {
      // Re-parse pins if script already loaded
      (window as any).PinUtils?.build?.();
    }
  }, []);

  // Construct the embed URL
  const embedUrl = boardName 
    ? `${profileUrl}/${boardName}`
    : profileUrl;

  return (
    <div 
      ref={containerRef}
      className="pinterest-embed-container"
      style={{ width, height, overflow: 'hidden' }}
    >
      <a 
        data-pin-do="embedUser" 
        data-pin-board-width="900"
        data-pin-scale-height="500"
        data-pin-scale-width="120"
        href={embedUrl}
      >
        Follow {profileUrl.split('/').filter(Boolean).pop()} on Pinterest
      </a>
    </div>
  );
}

// Pinterest Grid Component - Shows multiple boards
interface PinterestGridProps {
  boards: Array<{
    name: string;
    url: string;
    pinCount: number;
  }>;
}

export function PinterestGrid({ boards }: PinterestGridProps) {
  useEffect(() => {
    if (!(window as any).PinUtils) {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = '//assets.pinterest.com/js/pinit.js';
      document.body.appendChild(script);
    } else {
      (window as any).PinUtils?.build?.();
    }
  }, []);

  return (
    <div className="pinterest-grid">
      {boards.map((board) => (
        <div key={board.name} className="pinterest-board-card">
          <a 
            data-pin-do="embedBoard" 
            data-pin-board-width="400"
            data-pin-scale-height="300"
            data-pin-scale-width="80"
            href={board.url}
          >
            {board.name} — {board.pinCount} pins
          </a>
        </div>
      ))}
    </div>
  );
}

// Pinterest Profile Widget - Full profile embed
export function PinterestProfile({ 
  username,
  showFollowButton = true 
}: { 
  username: string;
  showFollowButton?: boolean;
}) {
  useEffect(() => {
    if (!(window as any).PinUtils) {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = '//assets.pinterest.com/js/pinit.js';
      document.body.appendChild(script);
    } else {
      (window as any).PinUtils?.build?.();
    }
  }, []);

  return (
    <div className="pinterest-profile">
      {showFollowButton && (
        <a 
          data-pin-do="buttonFollow" 
          href={`https://www.pinterest.com/${username}/`}
        >
          Follow @{username}
        </a>
      )}
      <a 
        data-pin-do="embedUser" 
        data-pin-board-width="900"
        data-pin-scale-height="500"
        data-pin-scale-width="120"
        href={`https://www.pinterest.com/${username}/`}
      >
        Visit {username}'s profile on Pinterest
      </a>
    </div>
  );
}

// Pinterest Single Pin Embed
export function PinterestPin({ pinUrl }: { pinUrl: string }) {
  useEffect(() => {
    if (!(window as any).PinUtils) {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = '//assets.pinterest.com/js/pinit.js';
      document.body.appendChild(script);
    } else {
      (window as any).PinUtils?.build?.();
    }
  }, []);

  return (
    <div className="pinterest-pin">
      <a 
        data-pin-do="embedPin" 
        data-pin-width="large"
        href={pinUrl}
      >
        View on Pinterest
      </a>
    </div>
  );
}
