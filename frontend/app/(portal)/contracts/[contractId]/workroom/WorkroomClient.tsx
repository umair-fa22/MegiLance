// @AI-HINT: Workroom client component - Kanban board, Files, Discussions for project collaboration
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { workroomApi } from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './Workroom.common.module.css';
import lightStyles from './Workroom.light.module.css';
import darkStyles from './Workroom.dark.module.css';

type TabType = 'kanban' | 'files' | 'discussions';
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee_name: string | null;
  due_date: string | null;
  created_at: string;
}

interface WorkroomFile {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  uploaded_by_name: string;
  created_at: string;
}

interface Discussion {
  id: number;
  title: string;
  content: string;
  author_name: string;
  reply_count: number;
  created_at: string;
  is_resolved: boolean;
}

// Raw API response types for transformation
interface RawTaskData {
  id: number;
  title: string;
  description?: string;
  column_name?: string;
  column?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee_name?: string;
  due_date?: string;
  created_at: string;
}

interface RawFileData {
  id: number;
  original_name?: string;
  filename?: string;
  file_size?: number;
  content_type?: string;
  file_type?: string;
  uploaded_by_name?: string;
  uploader_name?: string;
  created_at: string;
}

interface RawDiscussionData {
  id: number;
  title: string;
  content: string;
  author_name?: string;
  reply_count?: number;
  created_at: string;
  is_resolved?: boolean;
}

interface WorkroomClientProps {
  contractId: string;
}

export default function WorkroomClient({ contractId }: WorkroomClientProps) {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<WorkroomFile[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => { abortRef.current?.abort(); };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const [boardRes, filesRes, discussionsRes] = await Promise.all([
        workroomApi.getBoard(contractId).catch((e: unknown) => { console.error('Board load failed:', e); return null; }),
        workroomApi.getFiles(contractId).catch((e: unknown) => { console.error('Files load failed:', e); return null; }),
        workroomApi.getDiscussions(contractId).catch((e: unknown) => { console.error('Discussions load failed:', e); return null; }),
      ]);

      // Transform board data — API returns { columns: { todo: [...], in_progress: [...], ... } } or flat task list
      type BoardResponse = { columns?: Record<string, RawTaskData[]> } | RawTaskData[];
      const boardData = boardRes as BoardResponse | null;
      if (boardData) {
        const allTasks: Task[] = [];
        if (!Array.isArray(boardData) && boardData.columns) {
          for (const [status, columnTasks] of Object.entries(boardData.columns)) {
            if (Array.isArray(columnTasks)) {
              for (const t of columnTasks) {
                allTasks.push({
                  id: t.id,
                  title: t.title,
                  description: t.description || '',
                  status: (t.column_name || t.column || status) as TaskStatus,
                  priority: t.priority || 'medium',
                  assignee_name: t.assignee_name || null,
                  due_date: t.due_date || null,
                  created_at: t.created_at,
                });
              }
            }
          }
        } else if (Array.isArray(boardData)) {
          for (const t of boardData) {
            allTasks.push({
              id: t.id,
              title: t.title,
              description: t.description || '',
              status: (t.column_name || t.column || 'todo') as TaskStatus,
              priority: t.priority || 'medium',
              assignee_name: t.assignee_name || null,
              due_date: t.due_date || null,
              created_at: t.created_at,
            });
          }
        }
        setTasks(allTasks);
      } else {
        setTasks([]);
      }

      // Transform files
      type FilesResponse = { files?: RawFileData[] } | RawFileData[];
      const fileData = filesRes as FilesResponse | null;
      const fileList: RawFileData[] = fileData 
        ? (!Array.isArray(fileData) && fileData.files ? fileData.files : Array.isArray(fileData) ? fileData : [])
        : [];
      setFiles(fileList.map((f: RawFileData) => ({
        id: f.id,
        filename: f.original_name || f.filename || '',
        file_size: f.file_size || 0,
        file_type: f.content_type || f.file_type || '',
        uploaded_by_name: f.uploaded_by_name || f.uploader_name || 'Unknown',
        created_at: f.created_at,
      })));

      // Transform discussions
      type DiscussionsResponse = { discussions?: RawDiscussionData[] } | RawDiscussionData[];
      const discData = discussionsRes as DiscussionsResponse | null;
      const discList: RawDiscussionData[] = discData
        ? (!Array.isArray(discData) && discData.discussions ? discData.discussions : Array.isArray(discData) ? discData : [])
        : [];
      setDiscussions(discList.map((d: RawDiscussionData) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        author_name: d.author_name || 'Unknown',
        reply_count: d.reply_count || 0,
        created_at: d.created_at,
        is_resolved: d.is_resolved || false,
      })));
    } catch (err: unknown) {
      const isAbortError = err instanceof Error && err.name === 'AbortError';
      if (!isAbortError) {
        setError('Failed to load workroom data. Please try again.');
        if (process.env.NODE_ENV === 'development') {
          console.error('Workroom fetch error:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted, fetchData]);

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: TaskStatus) => {
    if (draggedTask && draggedTask.status !== newStatus) {
      const oldTasks = [...tasks];
      setTasks(prev => prev.map(t => 
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      ));
      const targetIndex = tasks.filter(t => t.status === newStatus).length;
      workroomApi.moveTask(draggedTask.id, newStatus, targetIndex).catch(() => {
        setTasks(oldTasks); // Rollback on failure
      });
    }
    setDraggedTask(null);
  };

  if (!mounted || !resolvedTheme) {
    return (
      <div className={commonStyles.loadingContainer}>
        <div className={commonStyles.loadingSpinner}></div>
      </div>
    );
  }

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (error) {
    return (
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.loadingContainer}>
          <p style={{ marginBottom: '1rem', color: 'var(--color-error, #e81123)' }}>{error}</p>
          <Button variant="primary" onClick={fetchData}>Retry</Button>
        </div>
      </main>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    review: tasks.filter(t => t.status === 'review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const columns: { key: TaskStatus; label: string; color: string }[] = [
    { key: 'todo', label: 'To Do', color: '#94a3b8' },
    { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { key: 'review', label: 'In Review', color: '#f59e0b' },
    { key: 'done', label: 'Done', color: '#22c55e' },
  ];

  return (
    <main className={cn(commonStyles.page, themeStyles.page)}>
      {/* Header */}
      <header className={cn(commonStyles.header, themeStyles.header)}>
        <div className={commonStyles.headerContent}>
          <h1 className={themeStyles.pageTitle}>Project Workroom</h1>
          <span className={themeStyles.contractId}>Contract #{contractId}</span>
        </div>
        <div className={commonStyles.headerActions}>
          <Button variant="secondary" size="sm">Invite Member</Button>
          <Button variant="primary" size="sm">Activity Log</Button>
        </div>
      </header>

      {/* Tabs */}
      <div className={commonStyles.tabContainer}>
        <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
          <button
            className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'kanban' && commonStyles.activeTab, activeTab === 'kanban' && themeStyles.activeTab)}
            onClick={() => setActiveTab('kanban')}
          >
            📋 Kanban Board
          </button>
          <button
            className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'files' && commonStyles.activeTab, activeTab === 'files' && themeStyles.activeTab)}
            onClick={() => setActiveTab('files')}
          >
            📁 Files ({files.length})
          </button>
          <button
            className={cn(commonStyles.tab, themeStyles.tab, activeTab === 'discussions' && commonStyles.activeTab, activeTab === 'discussions' && themeStyles.activeTab)}
            onClick={() => setActiveTab('discussions')}
          >
            💬 Discussions ({discussions.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <section className={commonStyles.content}>
        {loading ? (
          <div className={commonStyles.loadingContainer}>
            <div className={commonStyles.loadingSpinner}></div>
          </div>
        ) : (
          <>
            {/* Kanban Board */}
            {activeTab === 'kanban' && (
              <div className={commonStyles.kanbanContainer}>
                <div className={commonStyles.kanbanHeader}>
                  <Button variant="primary" size="sm">+ Add Task</Button>
                </div>
                <div className={commonStyles.kanbanBoard}>
                  {columns.map(col => (
                    <div
                      key={col.key}
                      className={cn(commonStyles.kanbanColumn, themeStyles.kanbanColumn)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(col.key)}
                    >
                      <div className={commonStyles.columnHeader}>
                        <span className={commonStyles.columnDot} style={{ backgroundColor: col.color }}></span>
                        <h3 className={themeStyles.columnTitle}>{col.label}</h3>
                        <span className={themeStyles.columnCount}>{tasksByStatus[col.key].length}</span>
                      </div>
                      <div className={commonStyles.taskList}>
                        {tasksByStatus[col.key].map(task => (
                          <article
                            key={task.id}
                            className={cn(commonStyles.taskCard, themeStyles.taskCard, draggedTask?.id === task.id && commonStyles.dragging)}
                            draggable
                            onDragStart={() => handleDragStart(task)}
                          >
                            <div className={commonStyles.taskPriority}>
                              <span className={cn(commonStyles.priorityDot, commonStyles[`priority_${task.priority}`])}></span>
                            </div>
                            <h4 className={themeStyles.taskTitle}>{task.title}</h4>
                            <p className={themeStyles.taskDesc}>{task.description}</p>
                            <div className={commonStyles.taskMeta}>
                              {task.assignee_name && (
                                <span className={themeStyles.assignee}>{task.assignee_name}</span>
                              )}
                              {task.due_date && (
                                <span className={themeStyles.dueDate}>📅 {formatDate(task.due_date)}</span>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {activeTab === 'files' && (
              <div className={commonStyles.filesContainer}>
                <div className={commonStyles.filesHeader}>
                  <Button variant="primary" size="sm">📤 Upload File</Button>
                </div>
                <div className={commonStyles.fileList}>
                  {files.map(file => (
                    <div key={file.id} className={cn(commonStyles.fileCard, themeStyles.fileCard)}>
                      <div className={commonStyles.fileIcon}>
                        {file.file_type.includes('pdf') ? '📄' : 
                         file.file_type.includes('image') ? '🖼️' : 
                         file.file_type.includes('figma') ? '🎨' : '📁'}
                      </div>
                      <div className={commonStyles.fileInfo}>
                        <h4 className={themeStyles.fileName}>{file.filename}</h4>
                        <p className={themeStyles.fileMeta}>
                          {formatFileSize(file.file_size)} • Uploaded by {file.uploaded_by_name} • {formatDate(file.created_at)}
                        </p>
                      </div>
                      <div className={commonStyles.fileActions}>
                        <Button variant="ghost" size="sm">Download</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussions */}
            {activeTab === 'discussions' && (
              <div className={commonStyles.discussionsContainer}>
                <div className={commonStyles.discussionsHeader}>
                  <Button variant="primary" size="sm">+ New Discussion</Button>
                </div>
                <div className={commonStyles.discussionList}>
                  {discussions.map(disc => (
                    <article key={disc.id} className={cn(commonStyles.discussionCard, themeStyles.discussionCard)}>
                      <div className={commonStyles.discussionMeta}>
                        {disc.is_resolved && (
                          <span className={cn(commonStyles.resolvedBadge, themeStyles.resolvedBadge)}>✓ Resolved</span>
                        )}
                        <span className={themeStyles.replyCount}>{disc.reply_count} replies</span>
                      </div>
                      <h3 className={cn(commonStyles.discussionTitle, themeStyles.discussionTitle)}>
                        {disc.title}
                      </h3>
                      <p className={themeStyles.discussionContent}>{disc.content}</p>
                      <div className={commonStyles.discussionFooter}>
                        <span className={themeStyles.discussionAuthor}>
                          {disc.author_name} • {formatDate(disc.created_at)}
                        </span>
                        <Button variant="ghost" size="sm">View Thread</Button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
