import re

with open("E:/MegiLance/frontend/app/components/molecules/VideoCall/VideoCall.tsx", "r", encoding="utf-8") as f:
    code = f.read()

ws_ref_code = "  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);\n  const wsRef = useRef<WebSocket | null>(null);"
code = re.sub(r"  const peerConnectionRef = useRef<RTCPeerConnection \| null>\(null\);", ws_ref_code, code)

new_init = """  const initializeCall = async () => {
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
  };"""

code = re.sub(r"  const initializeCall = async \(\) => \{.+?    \}\n  };\n", new_init + "\n", code, flags=re.DOTALL)

new_cleanup = """  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };"""

code = re.sub(r"  const cleanup = \(\) => \{.+?    \}\n  };\n", new_cleanup + "\n", code, flags=re.DOTALL)

with open("E:/MegiLance/frontend/app/components/molecules/VideoCall/VideoCall.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Applied replacements!")
