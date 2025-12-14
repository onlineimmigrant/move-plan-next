import React from 'react';

interface SkeletonLoaderProps {
  cards?: number;
  type?: 'booking' | 'ticket' | 'case' | 'activity';
}

export default function SkeletonLoader({ cards = 3, type = 'booking' }: SkeletonLoaderProps) {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      
      <div style={{ width: '100%' }}>
        {/* Stats Cards Skeleton */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap' as const
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              padding: '16px',
              background: '#f3f4f6',
              borderRadius: '12px',
              minWidth: '140px',
            }}>
              <div style={{ 
                ...shimmerStyle,
                height: '32px', 
                width: '50px', 
                borderRadius: '4px',
                marginBottom: '8px'
              }} />
              <div style={{ 
                ...shimmerStyle,
                height: '16px', 
                width: '80px', 
                borderRadius: '4px'
              }} />
            </div>
          ))}
        </div>

        {/* Content Cards Skeleton */}
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} style={{
            padding: '20px',
            background: '#fff',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  ...shimmerStyle,
                  height: '20px', 
                  width: '60%', 
                  borderRadius: '4px',
                  marginBottom: '8px'
                }} />
                <div style={{ 
                  ...shimmerStyle,
                  height: '16px', 
                  width: '40%', 
                  borderRadius: '4px'
                }} />
              </div>
              <div style={{ 
                ...shimmerStyle,
                height: '32px', 
                width: '80px', 
                borderRadius: '8px'
              }} />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px'
            }}>
              <div style={{ 
                ...shimmerStyle,
                height: '16px', 
                width: '100px', 
                borderRadius: '4px'
              }} />
              <div style={{ 
                ...shimmerStyle,
                height: '16px', 
                width: '80px', 
                borderRadius: '4px'
              }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
