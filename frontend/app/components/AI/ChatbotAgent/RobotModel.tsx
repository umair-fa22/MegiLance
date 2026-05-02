'use client';
import React, { useEffect, useState, createElement } from 'react';
import { useTheme } from 'next-themes';
import { MessageCircle } from 'lucide-react';

interface RobotModelProps {
  size?: number;
}

export default function RobotModel({ size = 40 }: RobotModelProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    import('@google/model-viewer').then(() => {
      setMounted(true);
    }).catch(() => {
      setMounted(true);
      setLoadError(true);
    });
  }, []);

  if (!mounted) {
    return <div style={{ width: size, height: size }} className="animate-pulse bg-primary/20 rounded-full" />;
  }

  // If model failed to load or is missing, show icon fallback
  if (loadError || !modelLoaded) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          borderRadius: '50%',
          background: resolvedTheme === 'dark' 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(69, 115, 223, 0.1) 0%, rgba(147, 197, 253, 0.05) 100%)',
          border: `2px solid ${resolvedTheme === 'dark' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(69, 115, 223, 0.2)'}`,
        }}
      >
        <MessageCircle 
          size={size * 0.5} 
          color={resolvedTheme === 'dark' ? '#60a5fa' : '#4573df'}
          strokeWidth={1.5}
        />
      </div>
    );
  }

  // MegiLance primary color is #4573df. 
  // We use filter to tint the robot to give it our brand vibe.
  return (
    <div style={{ 
      width: size, 
      height: size, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      filter: resolvedTheme === 'dark' ? 'drop-shadow(0 0 8px rgba(69,115,223,0.8)) hue-rotate(15deg)' : 'drop-shadow(0 0 4px rgba(69,115,223,0.4)) hue-rotate(15deg)'
    }}>
      {createElement('model-viewer', {
        src: "/3d/robot/scene.gltf",
        "auto-rotate": true,
        autoplay: true,
        "camera-controls": false,
        "disable-zoom": true,
        "rotation-per-second": "30deg",
        exposure: resolvedTheme === 'dark' ? "1.5" : "1",
        "shadow-intensity": "0",
        onLoad: () => setModelLoaded(true),
        onError: () => setLoadError(true),
        style: { 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'transparent',
          outline: 'none',
          transform: 'scale(1.2)'
        }
      })}
    </div>
  );
}
