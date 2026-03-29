'use client';
import React, { useEffect, useState, createElement } from 'react';
import { useTheme } from 'next-themes';

interface RobotModelProps {
  size?: number;
}

export default function RobotModel({ size = 40 }: RobotModelProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    import('@google/model-viewer').then(() => {
      setMounted(true);
    }).catch(console.error);
  }, []);

  if (!mounted) {
    return <div style={{ width: size, height: size }} className="animate-pulse bg-primary/20 rounded-full" />;
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
