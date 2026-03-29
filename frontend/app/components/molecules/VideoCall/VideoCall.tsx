// @AI-HINT: Video call component with WebRTC, screen sharing, and controls

'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getAuthToken } from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './VideoCall.common.module.css';
import lightStyles from './VideoCall.light.module.css';
import darkStyles from './VideoCall.dark.module.css';

interface VideoCallProps {
  callId?: string;
  participants?: string[];
  onEnd?: () => void;
}

export default function VideoCall({ callId, participants = [], onEnd }: VideoCallProps) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle incoming streams
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setCallStatus('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setCallStatus('ended');
        }
      };

      // Set up WebSocket signaling
      const token = getAuthToken();
      if (!token) throw new Error("Authentication required for video calls");
      
      const wsUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('http', 'ws')
        : 'ws://localhost:8000';
      
      const ws = new WebSocket(`${wsUrl}/api/video/ws/${callId || 'default-room'}?token=${token}`);
      wsRef.current = ws;

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate
          }));
        }
      };
      
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'offer',
              sdp: pc.localDescription?.sdp
            }));
          }
        } catch (err) {
          console.error("Error creating offer", err);
        }
      };

      ws.onopen = () => {
        // Send join event
        ws.send(JSON.stringify({ type: 'join', user_id: 'local_user' }));
      };

      ws.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        
        if (data.type === 'participant_joined') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription?.sdp }));
        }
        else if (data.type === 'offer' && data.sdp) {
          if (pc.signalingState !== "stable") return;
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription?.sdp }));
        }
        else if (data.type === 'answer' && data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        }
        else if (data.type === 'ice_candidate' && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        else if (data.type === 'participant_left') {
          setCallStatus('ended');
        }
      };

      setCallStatus('connected');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize video call');
      if (process.env.NODE_ENV === 'development') {
        console.error('Video call error:', err);
      }
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      } as any);

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender) {
        sender.replaceTrack(screenTrack);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (err: any) {
      setError('Screen sharing failed: ' + err.message);
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
        setIsScreenSharing(false);
      }
    }
  };

  const toggleWhiteboard = async () => {
    if (!showWhiteboard) {
      try {
        await fetch(`/api/video/calls/${callId}/whiteboard`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        setShowWhiteboard(true);
      } catch (err) {
        setError('Failed to enable whiteboard');
      }
    } else {
      setShowWhiteboard(false);
    }
  };

  const toggleRecording = async () => {
    try {
      if (!isRecording) {
        await fetch(`/api/video/calls/${callId}/recording/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        setIsRecording(true);
      } else {
        await fetch(`/api/video/calls/${callId}/recording/stop`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        setIsRecording(false);
      }
    } catch (err) {
      setError('Recording failed');
    }
  };

  const endCall = async () => {
    try {
      await fetch(`/api/video/calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      cleanup();
      setCallStatus('ended');
      onEnd?.();
    } catch (err) {
      setError('Failed to end call');
    }
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      <div className={cn(commonStyles.videoGrid, themeStyles.videoGrid)}>
        {/* Remote Video */}
        <div className={cn(commonStyles.remoteVideo, themeStyles.remoteVideo)}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={commonStyles.video}
          />
          {callStatus === 'connecting' && (
            <div className={commonStyles.statusOverlay}>
              <div className={commonStyles.spinner}></div>
              <p>Connecting...</p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className={cn(commonStyles.localVideo, themeStyles.localVideo)}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={commonStyles.video}
          />
          {isVideoOff && (
            <div className={commonStyles.videoOff}>
              <span>📷</span>
              <p>Camera Off</p>
            </div>
          )}
        </div>

        {/* Whiteboard Canvas */}
        {showWhiteboard && (
          <div className={cn(commonStyles.whiteboard, themeStyles.whiteboard)}>
            <canvas
              ref={canvasRef}
              className={commonStyles.canvas}
              width={1280}
              height={720}
            />
            <div className={commonStyles.whiteboardTools}>
              <Button variant="ghost" size="sm">✏️ Draw</Button>
              <Button variant="ghost" size="sm">⬜ Shape</Button>
              <Button variant="ghost" size="sm">🗑️ Clear</Button>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className={cn(commonStyles.controls, themeStyles.controls)}>
        <Button
          variant={isMuted ? "danger" : "ghost"}
          size="lg"
          onClick={toggleMute}
          className={commonStyles.controlButton}
        >
          {isMuted ? '🔇' : '🎤'}
        </Button>

        <Button
          variant={isVideoOff ? "danger" : "ghost"}
          size="lg"
          onClick={toggleVideo}
          className={commonStyles.controlButton}
        >
          {isVideoOff ? '📷' : '📹'}
        </Button>

        <Button
          variant={isScreenSharing ? "primary" : "ghost"}
          size="lg"
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={commonStyles.controlButton}
        >
          🖥️
        </Button>

        <Button
          variant={showWhiteboard ? "primary" : "ghost"}
          size="lg"
          onClick={toggleWhiteboard}
          className={commonStyles.controlButton}
        >
          📝
        </Button>

        <Button
          variant={isRecording ? "danger" : "ghost"}
          size="lg"
          onClick={toggleRecording}
          className={commonStyles.controlButton}
        >
          {isRecording ? '⏺️' : '⏺️'}
        </Button>

        <Button
          variant="danger"
          size="lg"
          onClick={endCall}
          className={commonStyles.endButton}
        >
          📞 End Call
        </Button>
      </div>

      {/* Participants List */}
      {participants.length > 0 && (
        <div className={cn(commonStyles.participants, themeStyles.participants)}>
          <h4>Participants ({participants.length})</h4>
          <ul>
            {participants.map((participant, index) => (
              <li key={index}>{participant}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
