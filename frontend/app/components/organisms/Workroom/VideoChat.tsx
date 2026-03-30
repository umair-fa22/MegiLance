import { useEffect, useState } from 'react';
import commonStyles from './VideoChat.common.module.css';
import lightStyles from './VideoChat.light.module.css';
import darkStyles from './VideoChat.dark.module.css';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

interface VideoChatProps {
  contractId: string;
}

export default function VideoChat({ contractId }: VideoChatProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.videoGrid}>
        <div className={commonStyles.videoPlaceholder}>
          <div className={commonStyles.avatar}>Client</div>
          <span className={commonStyles.nameTag}>Client</span>
        </div>
        <div className={commonStyles.videoPlaceholder}>
          <div className={commonStyles.avatar}>You</div>
          <span className={commonStyles.nameTag}>You</span>
        </div>
      </div>
      <div className={cn(commonStyles.controls, themeStyles.controls)}>
        <button 
          onClick={() => setMicOn(!micOn)} 
          className={cn(commonStyles.controlBtn, themeStyles.controlBtn, !micOn && commonStyles.controlBtnOff)}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button 
          onClick={() => setVideoOn(!videoOn)} 
          className={cn(commonStyles.controlBtn, themeStyles.controlBtn, !videoOn && commonStyles.controlBtnOff)}
        >
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button 
          className={cn(commonStyles.controlBtn, commonStyles.endCallBtn)}
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
