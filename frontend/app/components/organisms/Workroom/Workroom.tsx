import { useState } from 'react';
import commonStyles from './Workroom.common.module.css';
import lightStyles from './Workroom.light.module.css';
import darkStyles from './Workroom.dark.module.css';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import LiveEditor from './LiveEditor';
import Whiteboard from './Whiteboard';
import VideoChat from './VideoChat';
import { Code, PenTool, Video as VideoIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface WorkroomProps {
  contractId: string;
}

export default function Workroom({ contractId }: WorkroomProps) {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'editor' | 'whiteboard'>('editor');

  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.headerLeft}>
          <Link href="/dashboard" className={themeStyles.backButton}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h2>Live Collaboration Room</h2>
          <span className={themeStyles.contractBadge}>Contract #{contractId.substring(0, 8)}</span>
        </div>
      </div>

      <div className={commonStyles.content}>
        <div className={commonStyles.mainArea}>
          <div className={themeStyles.tabs}>
            <button 
              className={cn(commonStyles.tabBtn, themeStyles.tabBtn, activeTab === 'editor' && themeStyles.activeTab)}
              onClick={() => setActiveTab('editor')}
            >
              <Code size={16} /> Code Editor
            </button>
            <button 
              className={cn(commonStyles.tabBtn, themeStyles.tabBtn, activeTab === 'whiteboard' && themeStyles.activeTab)}
              onClick={() => setActiveTab('whiteboard')}
            >
              <PenTool size={16} /> Whiteboard
            </button>
          </div>
          
          <div className={commonStyles.tabContent}>
            {activeTab === 'editor' ? (
              <LiveEditor contractId={contractId} />
            ) : (
              <Whiteboard contractId={contractId} />
            )}
          </div>
        </div>

        <div className={commonStyles.sidebar}>
          <div className={commonStyles.sidebarSection}>
            <h3 className={commonStyles.sectionTitle}><VideoIcon size={16} /> Active Call</h3>
            <VideoChat contractId={contractId} />
          </div>
          
          <div className={commonStyles.sidebarSection}>
            <h3 className={commonStyles.sectionTitle}>Participants (2)</h3>
            <ul className={themeStyles.participantList}>
              <li>
                <div className={commonStyles.avatarSm}>Y</div>
                <span>You</span>
              </li>
              <li>
                <div className={commonStyles.avatarSm}>C</div>
                <span>Client</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
