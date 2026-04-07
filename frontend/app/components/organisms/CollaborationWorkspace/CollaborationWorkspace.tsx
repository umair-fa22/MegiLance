// @AI-HINT: Real-time collaboration workspace integrating a collaborative editor, whiteboard, and team chat.
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './CollaborationWorkspace.common.module.css';
import lightStyles from './CollaborationWorkspace.light.module.css';
import darkStyles from './CollaborationWorkspace.dark.module.css';
import { MessageSquare, LayoutTemplate, PenTool, Code, Maximize2, Users, Save, Download } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isSelf: boolean;
}

interface WorkspaceProps {
  projectId: string;
  currentUser: { id: string; name: string };
  initialMode?: 'whiteboard' | 'code';
}

export default function CollaborationWorkspace({ projectId, currentUser, initialMode = 'whiteboard' }: WorkspaceProps) {
  const { resolvedTheme } = useTheme();
  const [activeMode, setActiveMode] = useState<'whiteboard' | 'code'>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [connectedUsers, setConnectedUsers] = useState([currentUser, { id: 'usr_2', name: 'Alex Client' }]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  useEffect(() => {
    // Mock initial messages
    setMessages([
      { id: '1', sender: 'Alex Client', text: 'Hey, I opened the workspace.', timestamp: new Date(Date.now() - 60000), isSelf: false },
      { id: '2', sender: currentUser.name, text: 'Awesome, let me pull up the mockups.', timestamp: new Date(Date.now() - 30000), isSelf: true }
    ]);
  }, [currentUser.name]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // Simple Canvas Drawing Mock logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = resolvedTheme === 'dark' ? '#fff' : '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: currentUser.name,
      text: newMessage.trim(),
      timestamp: new Date(),
      isSelf: true
    }]);
    setNewMessage('');
    
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'Alex Client',
        text: 'Makes sense. Let me check the code.',
        timestamp: new Date(),
        isSelf: false
      }]);
    }, 2000);
  };

  return (
    <div className={cn(commonStyles.workspaceContainer, themeStyles.workspaceContainer)}>
      {/* Header Toolbar */}
      <header className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
        <div className={commonStyles.toolbarLeft}>
          <h2 className={commonStyles.title}>Collaboration Workspace</h2>
          <div className={commonStyles.modeSwitch}>
            <button 
              className={cn(commonStyles.modeBtn, activeMode === 'whiteboard' && commonStyles.activeMode)}
              onClick={() => setActiveMode('whiteboard')}
            >
              <PenTool size={16} /> Whiteboard
            </button>
            <button 
              className={cn(commonStyles.modeBtn, activeMode === 'code' && commonStyles.activeMode)}
              onClick={() => setActiveMode('code')}
            >
              <Code size={16} /> Code Editor
            </button>
          </div>
        </div>

        <div className={commonStyles.toolbarRight}>
          <div className={commonStyles.usersList}>
            <Users size={16} className={commonStyles.usersIcon} />
            <span className={commonStyles.usersCount}>{connectedUsers.length} Online</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(!isChatOpen)}>
            <MessageSquare size={16} />
          </Button>
          <Button variant="primary" size="sm">
            <Save size={16} className="mr-2" /> Save State
          </Button>
        </div>
      </header>

      {/* Main Area */}
      <div className={commonStyles.mainArea}>
        {/* Canvas / Editor */}
        <div className={commonStyles.editorArea}>
          {activeMode === 'whiteboard' ? (
            <div className={commonStyles.whiteboardWrapper}>
              <div className={commonStyles.whiteboardTools}>
                <button className={commonStyles.toolBtn} title="Draw"><PenTool size={18} /></button>
                <button className={commonStyles.toolBtn} title="Shapes"><LayoutTemplate size={18} /></button>
                <button className={commonStyles.toolBtn} title="Clear"><Download size={18} /></button>
              </div>
              <canvas 
                ref={canvasRef}
                className={cn(commonStyles.canvas, themeStyles.canvas)}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          ) : (
            <div className={cn(commonStyles.codeEditor, themeStyles.codeEditor)}>
              <div className={commonStyles.codeHeader}>
                <span>main.tsx</span>
                <span className={commonStyles.langBadge}>TypeScript</span>
              </div>
              <textarea 
                className={commonStyles.codeTextarea} 
                defaultValue={"export default function App() {\n  return <div>Hello World</div>;\n}"}
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <aside className={cn(commonStyles.chatSidebar, themeStyles.chatSidebar)}>
            <div className={commonStyles.chatHeader}>
              <h3>Team Chat</h3>
              <span className={commonStyles.statusDot} />
            </div>
            
            <div className={commonStyles.chatMessages}>
              {messages.map(msg => (
                 <div key={msg.id} className={cn(commonStyles.messageWrapper, msg.isSelf ? commonStyles.messageSelf : commonStyles.messageOther)}>
                   {!msg.isSelf && <span className={commonStyles.messageSender}>{msg.sender}</span>}
                   <div className={cn(commonStyles.messageBubble, msg.isSelf ? commonStyles.bubbleSelf : commonStyles.bubbleOther)}>
                     {msg.text}
                   </div>
                   <span className={commonStyles.messageTime}>
                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={commonStyles.chatInputArea}>
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className={commonStyles.chatInput}
              />
              <button type="submit" className={commonStyles.sendBtn} disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
