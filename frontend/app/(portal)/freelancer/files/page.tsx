// @AI-HINT: Freelancer file management page — upload, browse, organize, download project files
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/atoms/Button';
import commonStyles from './Files.common.module.css';
import lightStyles from './Files.light.module.css';
import darkStyles from './Files.dark.module.css';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { apiFetch } from '@/lib/api/core';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size: number;
  project_name?: string;
  uploaded_at: string;
  updated_at: string;
  parent_id: string | null;
  tags: string[];
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'image/svg+xml': '🖼️',
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'text/plain': '📝',
  'text/csv': '📊',
  'application/json': '📋',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📃',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
  'video/mp4': '🎬',
  'audio/mpeg': '🎵',
  'folder': '📁',
};

function getFileIcon(item: FileItem): string {
  if (item.type === 'folder') return '📁';
  return FILE_TYPE_ICONS[item.mimeType || ''] || '📄';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function FilesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'All Files' }]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await apiFetch<any>('/portfolio/files');
      const items: FileItem[] = (Array.isArray(data) ? data : data.items || []).map((f: any) => ({
          id: String(f.id),
          name: f.title || f.name || f.filename || 'Untitled',
          type: f.type === 'folder' ? 'folder' : 'file',
          mimeType: f.mime_type || f.mimeType || '',
          size: f.size || f.file_size || 0,
          project_name: f.project_name || f.category || '',
          uploaded_at: f.created_at || f.uploaded_at || new Date().toISOString(),
          updated_at: f.updated_at || f.created_at || new Date().toISOString(),
          parent_id: f.parent_id || null,
          tags: f.tags || [],
        }));
        setFiles(items);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files
    .filter(f => f.parent_id === currentFolder)
    .filter(f => {
      if (typeFilter === 'folders') return f.type === 'folder';
      if (typeFilter === 'images') return f.mimeType?.startsWith('image/');
      if (typeFilter === 'documents') return f.mimeType?.includes('pdf') || f.mimeType?.includes('document') || f.mimeType?.includes('text');
      if (typeFilter === 'archives') return f.mimeType?.includes('zip') || f.mimeType?.includes('rar');
      return true;
    })
    .filter(f => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(q) || (f.project_name || '').toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      // Folders first
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const totalFiles = files.filter(f => f.type === 'file').length;
  const totalFolders = files.filter(f => f.type === 'folder').length;
  const totalSize = files.filter(f => f.type === 'file').reduce((sum, f) => sum + f.size, 0);

  const navigateToFolder = (folder: FileItem) => {
    setCurrentFolder(folder.id);
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const target = folderPath[index];
    setCurrentFolder(target.id);
    setFolderPath(prev => prev.slice(0, index + 1));
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigateToFolder(file);
    }
  };

  const handleDownload = (file: FileItem) => {
    if (file.type === 'folder') return;
    const url = `/api/portfolio/files/${file.id}/download`;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete "${file.name}"?`)) return;
    try {
      await apiFetch(`/portfolio/files/${file.id}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch {
      alert('Failed to delete file');
    }
  };

  // Upload handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFilesToUpload(droppedFiles);
  }, []);

  const addFilesToUpload = (newFiles: File[]) => {
    const items: UploadingFile[] = newFiles.map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploadFiles(prev => [...prev, ...items]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFilesToUpload(Array.from(e.target.files));
    }
  };

  const removeUploadFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUploadAll = async () => {
    for (const item of uploadFiles) {
      if (item.status !== 'pending') continue;
      setUploadFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        if (currentFolder) formData.append('parent_id', currentFolder);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadFiles(prev => prev.map(f =>
            f.id === item.id && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          ));
        }, 200);

        await apiFetch('/portfolio/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        setUploadFiles(prev => prev.map(f =>
          f.id === item.id ? { ...f, progress: 100, status: 'done' } : f
        ));
      } catch {
        setUploadFiles(prev => prev.map(f =>
          f.id === item.id ? { ...f, status: 'error' } : f
        ));
      }
    }
    // Refresh file list
    await fetchFiles();
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Files</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your project files, documents, and deliverables
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="primary" onClick={() => setShowUpload(true)}>
                Upload Files
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.05}>
          <div className={commonStyles.statsBar}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>📄</div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Files</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{totalFiles}</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>📁</div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Folders</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{totalFolders}</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>💾</div>
              <div className={commonStyles.statInfo}>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Storage Used</span>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{formatFileSize(totalSize)}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Breadcrumb */}
        {folderPath.length > 1 && (
          <ScrollReveal delay={0.1}>
            <nav className={cn(commonStyles.breadcrumb)} aria-label="File navigation">
              {folderPath.map((crumb, i) => (
                <React.Fragment key={crumb.id ?? 'root'}>
                  {i > 0 && <span className={cn(commonStyles.breadcrumbSep, themeStyles.breadcrumbSep)}>›</span>}
                  {i < folderPath.length - 1 ? (
                    <button
                      className={cn(commonStyles.breadcrumbBtn, themeStyles.breadcrumbBtn)}
                      onClick={() => navigateToBreadcrumb(i)}
                    >
                      {crumb.name}
                    </button>
                  ) : (
                    <span className={cn(commonStyles.breadcrumbCurrent, themeStyles.breadcrumbCurrent)}>
                      {crumb.name}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </ScrollReveal>
        )}

        {/* Filters */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.filterBar)}>
            <input
              type="text"
              placeholder="Search files…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              aria-label="Search files"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="folders">Folders</option>
              <option value="images">Images</option>
              <option value="documents">Documents</option>
              <option value="archives">Archives</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
              className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
              aria-label="Sort by"
            >
              <option value="date">Recent</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <div className={cn(commonStyles.viewToggle, themeStyles.viewToggle)}>
              <button
                className={cn(commonStyles.viewBtn, themeStyles.viewBtn, viewMode === 'grid' && commonStyles.viewBtnActive, viewMode === 'grid' && themeStyles.viewBtnActive)}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid view"
              >
                ▦
              </button>
              <button
                className={cn(commonStyles.viewBtn, themeStyles.viewBtn, viewMode === 'list' && commonStyles.viewBtnActive, viewMode === 'list' && themeStyles.viewBtnActive)}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* File Content */}
        {loading ? (
          <div className={commonStyles.loading}>Loading files…</div>
        ) : filteredFiles.length === 0 ? (
          <ScrollReveal>
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <div className={commonStyles.emptyIcon}>📂</div>
              <div className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
                {searchQuery || typeFilter !== 'all' ? 'No matching files' : 'No files yet'}
              </div>
              <p className={commonStyles.emptyText}>
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Upload your first file to get started. Organize project documents, deliverables, and assets.'}
              </p>
              {!searchQuery && typeFilter === 'all' && (
                <Button variant="primary" onClick={() => setShowUpload(true)}>
                  Upload Files
                </Button>
              )}
            </div>
          </ScrollReveal>
        ) : viewMode === 'grid' ? (
          <StaggerContainer className={commonStyles.fileGrid}>
            {filteredFiles.map(file => (
              <StaggerItem key={file.id}>
                <div
                  className={cn(commonStyles.fileCardWrapper, themeStyles.fileCardWrapper)}
                  onClick={() => handleFileClick(file)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleFileClick(file)}
                  aria-label={`${file.type === 'folder' ? 'Open folder' : 'File'}: ${file.name}`}
                >
                  <div className={cn(commonStyles.fileCardPreview, themeStyles.fileCardPreview)}>
                    {getFileIcon(file)}
                  </div>
                  <div className={commonStyles.fileCardBody}>
                    <div className={cn(commonStyles.fileCardName, themeStyles.fileCardName)} title={file.name}>
                      {file.name}
                    </div>
                    <div className={cn(commonStyles.fileCardMeta, themeStyles.fileCardMeta)}>
                      <span>{file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}</span>
                      <span>{formatDate(file.updated_at)}</span>
                    </div>
                  </div>
                  <div className={cn(commonStyles.fileCardActions, themeStyles.fileCardActions)}>
                    <div className={commonStyles.fileActions} style={{ opacity: 1 }}>
                      {file.type === 'file' && (
                        <button
                          className={cn(commonStyles.actionBtn, themeStyles.actionBtn)}
                          onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                          title="Download"
                          aria-label={`Download ${file.name}`}
                        >
                          ⬇️
                        </button>
                      )}
                      <button
                        className={cn(commonStyles.actionBtn, themeStyles.actionBtn)}
                        onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                        title="Delete"
                        aria-label={`Delete ${file.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <ScrollReveal>
            <table className={cn(commonStyles.fileTable, themeStyles.fileTable)} role="grid">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Project</th>
                  <th>Size</th>
                  <th>Modified</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map(file => (
                  <tr
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFileClick(file)}
                    tabIndex={0}
                    role="row"
                  >
                    <td>
                      <div className={commonStyles.fileRow}>
                        <span className={commonStyles.fileIcon}>{getFileIcon(file)}</span>
                        <span className={cn(commonStyles.fileName, themeStyles.fileName)}>{file.name}</span>
                      </div>
                    </td>
                    <td>{file.project_name || '—'}</td>
                    <td>{file.type === 'folder' ? '—' : formatFileSize(file.size)}</td>
                    <td>{formatDate(file.updated_at)}</td>
                    <td>
                      <div className={commonStyles.fileActions}>
                        {file.type === 'file' && (
                          <button
                            className={cn(commonStyles.actionBtn, themeStyles.actionBtn)}
                            onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                            title="Download"
                            aria-label={`Download ${file.name}`}
                          >
                            ⬇️
                          </button>
                        )}
                        <button
                          className={cn(commonStyles.actionBtn, themeStyles.actionBtn)}
                          onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                          title="Delete"
                          aria-label={`Delete ${file.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollReveal>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2>Upload Files</h2>
                <button
                  onClick={() => { setShowUpload(false); setUploadFiles([]); }}
                  className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
                  aria-label="Close upload dialog"
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div
                  className={cn(
                    commonStyles.dropzone,
                    themeStyles.dropzone,
                    isDragging && commonStyles.dropzoneActive,
                    isDragging && themeStyles.dropzoneActive
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Drop files here or click to browse"
                >
                  <div className={commonStyles.dropzoneIcon}>📤</div>
                  <div className={cn(commonStyles.dropzoneText, themeStyles.dropzoneText)}>
                    {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
                  </div>
                  <div className={cn(commonStyles.dropzoneHint, themeStyles.dropzoneHint)}>
                    PDF, images, documents, archives — up to 50MB each
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  aria-hidden="true"
                />

                {uploadFiles.length > 0 && (
                  <div className={commonStyles.uploadList}>
                    {uploadFiles.map(item => (
                      <div key={item.id} className={cn(commonStyles.uploadItem, themeStyles.uploadItem)}>
                        <span className={commonStyles.uploadItemIcon}>
                          {item.status === 'done' ? '✅' : item.status === 'error' ? '❌' : '📄'}
                        </span>
                        <div className={commonStyles.uploadItemInfo}>
                          <div className={cn(commonStyles.uploadItemName, themeStyles.uploadItemName)}>
                            {item.file.name}
                          </div>
                          <div className={cn(commonStyles.uploadItemSize, themeStyles.uploadItemSize)}>
                            {formatFileSize(item.file.size)}
                          </div>
                          {item.status === 'uploading' && (
                            <div className={cn(commonStyles.progressBar, themeStyles.progressBar)}>
                              <div
                                className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => removeUploadFile(item.id)}
                            className={cn(commonStyles.uploadItemRemove, themeStyles.uploadItemRemove)}
                            aria-label={`Remove ${item.file.name}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
                <Button variant="secondary" onClick={() => { setShowUpload(false); setUploadFiles([]); }}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUploadAll}
                  isLoading={uploadFiles.some(f => f.status === 'uploading')}
                >
                  Upload {uploadFiles.filter(f => f.status === 'pending').length > 0 ? `(${uploadFiles.filter(f => f.status === 'pending').length})` : ''}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
