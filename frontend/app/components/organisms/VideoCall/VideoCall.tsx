// @AI-HINT: Embedded WebRTC Video/Audio component for real-time client-freelancer sessions
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './VideoCall.common.module.css';
import lightStyles from './VideoCall.light.module.css';
import darkStyles from './VideoCall.dark.module.css';
import { Mic, MicOff, Video, VideoOff, PhoneMissed, MonitorUp, Settings } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

interface VideoCallProps {
  roomId: string;
  userName: string;
  onLeave?: () => void;
}

export default function VideoCall({ roomId, userName, onLeave }: VideoCallProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Mock initialization of WebRTC stream
    setIsConnected(true);
    
    // Mock user video via a placeholder stream or empty state
    // In production, would use navigator.mediaDevices.getUserMedia
    return () => {
      // Cleanup WebRTC connections
      setIsConnected(false);
    };
  }, [roomId]);

  return (
    <div className={cn(commonStyles.videoContainer, themeStyles.videoContainer)}>
      <div className={commonStyles.videoGrid}>
        {/* Remote Video (Mocked as placeholder) */}
        <div className={commonStyles.remoteVideoWrapper}>
          <div className={cn(commonStyles.placeholder, themeStyles.placeholder)}>
            <span className={commonStyles.avatarText}>Client Name</span>
          </div>
          <video 
            ref={remoteVideoRef} 
            className={commonStyles.remoteVideo} 
            autoPlay 
            playsInline 
            muted 
          />
          <div className={commonStyles.nameTag}>Client Name</div>
        </div>

        {/* Local Video */}
        <div className={commonStyles.localVideoWrapper}>
          <div className={cn(commonStyles.placeholderLocal, themeStyles.placeholderLocal)}>
            <span className={commonStyles.avatarText}>{userName.charAt(0)}</span>
          </div>
          <video 
            ref={localVideoRef} 
            className={commonStyles.localVideo} 
            autoPlay 
            playsInline 
            muted={isAudioMuted} 
          />
          <div className={commonStyles.nameTag}>You ({userName})</div>
        </div>
      </div>

      <div className={cn(commonStyles.controls, themeStyles.controls)}>
        <Button 
          variant={isAudioMuted ? "danger" : "secondary"} 
          size="icon" 
          onClick={() => setIsAudioMuted(!isAudioMuted)}
          className={commonStyles.controlBtn}
        >
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>

        <Button 
          variant={isVideoMuted ? "danger" : "secondary"} 
          size="icon" 
          onClick={() => setIsVideoMuted(!isVideoMuted)}
          className={commonStyles.controlBtn}
        >
          {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
        </Button>

        <Button 
          variant={isScreenSharing ? "primary" : "secondary"} 
          size="icon" 
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={commonStyles.controlBtn}
        >
          <MonitorUp size={20} />
        </Button>

        <Button 
          variant="secondary" 
          size="icon" 
          className={commonStyles.controlBtn}
        >
          <Settings size={20} />
        </Button>

        <Button 
          variant="danger" 
          size="md" 
          onClick={() => {
            setIsConnected(false);
            if (onLeave) onLeave();
          }}
          className={commonStyles.leaveBtn}
        >
          <PhoneMissed size={20} className={commonStyles.btnIcon} /> Leave
        </Button>
      </div>
      
      {!isConnected && (
         <div className={commonStyles.overlay}>
           <h2>Disconnected</h2>
           <p>You have left the call.</p>
         </div>
      )}
    </div>
  );
}
