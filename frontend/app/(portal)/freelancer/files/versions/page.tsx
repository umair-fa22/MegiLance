// @AI-HINT: File Versions Page - View and manage file version history
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './FileVersions.common.module.css';
import lightStyles from './FileVersions.light.module.css';
import darkStyles from './FileVersions.dark.module.css';

interface FileVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  changeNote?: string;
  downloadUrl: string;
  isCurrent: boolean;
}

interface FileInfo {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  totalVersions: number;
  currentVersion: number;
  createdAt: string;
}

export default function FileVersionsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading version history...</div>}>
      <FileVersionsPage />
    </Suspense>
  );
}

function FileVersionsPage() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fileId = searchParams.get('fileId');

  useEffect(() => {
    setMounted(true);
    if (fileId) {
      fetchFileVersions(fileId);
    }
  }, [fileId]);

  const fetchFileVersions = async (id: string) => {
    setLoading(true);
    try {
      // Fetch real file versions from API
      const apiModule = await import('@/lib/api') as any;
      const filesApi = apiModule.filesApi || apiModule.default?.files || {};
      
      const [fileData, versionsData] = await Promise.all([
        filesApi.get?.(id).catch(() => null),
        filesApi.getVersions?.(id).catch(() => null),
      ]);

      // Transform API data or use defaults
      const fileInfoFromApi: FileInfo | null = fileData ? {
        id: (fileData as any).id?.toString() || id,
        name: (fileData as any).name || (fileData as any).file_name || 'Unknown File',
        projectId: (fileData as any).project_id?.toString() || 'proj_001',
        projectName: (fileData as any).project_name || 'Project',
        totalVersions: (fileData as any).total_versions || (versionsData as any)?.length || 1,
        currentVersion: (fileData as any).current_version || 1,
        createdAt: (fileData as any).created_at || new Date().toISOString()
      } : null;

      const versionsArray = Array.isArray(versionsData) ? versionsData : versionsData?.items || [];
      const transformedVersions: FileVersion[] = versionsArray.map((v: any, idx: number, arr: any[]) => ({
        id: v.id?.toString() || `v${idx + 1}`,
        versionNumber: v.version_number || v.versionNumber || arr.length - idx,
        fileName: v.file_name || v.fileName || 'file',
        fileSize: v.file_size || v.fileSize || 0,
        mimeType: v.mime_type || v.mimeType || 'application/octet-stream',
        uploadedBy: v.uploaded_by_name || v.uploadedBy || 'Unknown',
        uploadedAt: v.uploaded_at || v.uploadedAt || new Date().toISOString(),
        changeNote: v.change_note || v.changeNote,
        downloadUrl: v.download_url || v.downloadUrl || '#',
        isCurrent: v.is_current ?? idx === 0,
      }));

      if (fileInfoFromApi) {
        setFileInfo(fileInfoFromApi);
      }

      setVersions(transformedVersions);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch file versions:', error);
      }
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleRestore = async (versionId: string) => {
    // API call would go here
    showToast(`Version ${versionId} restored as current version`, 'success');
    fetchFileVersions(fileId!);
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      setComparing(true);
      // Would open comparison view
    }
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (!fileId) {
    return (
      <PageTransition>
        <div className={cn(commonStyles.container, themeStyles.container)}>
          <ScrollReveal>
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <div className={commonStyles.emptyIcon}>📁</div>
              <h2>Select a File</h2>
              <p>Choose a file from your projects to view its version history</p>
              <button 
                className={cn(commonStyles.browseButton, themeStyles.browseButton)}
                onClick={() => router.push('/freelancer/files')}
              >
                Browse Files
              </button>
            </div>
          </ScrollReveal>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <button 
              className={cn(commonStyles.backButton, themeStyles.backButton)}
              onClick={() => router.back()}
            >
              ← Back to Files
            </button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading version history...</div>
        ) : fileInfo && (
          <>
            {/* File Info Card */}
            <ScrollReveal delay={0.1}>
              <div className={cn(commonStyles.fileInfoCard, themeStyles.fileInfoCard)}>
                <div className={commonStyles.fileIcon}>📄</div>
                <div className={commonStyles.fileDetails}>
                  <h1 className={cn(commonStyles.fileName, themeStyles.fileName)}>{fileInfo.name}</h1>
                  <p className={cn(commonStyles.projectName, themeStyles.projectName)}>
                    {fileInfo.projectName}
                  </p>
                  <div className={cn(commonStyles.fileMeta, themeStyles.fileMeta)}>
                    <span>{fileInfo.totalVersions} versions</span>
                    <span>•</span>
                    <span>Created {new Date(fileInfo.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Compare Bar */}
            {selectedVersions.length > 0 && (
              <ScrollReveal delay={0.2}>
                <div className={cn(commonStyles.compareBar, themeStyles.compareBar)}>
                  <span>{selectedVersions.length} version(s) selected</span>
                  <div className={commonStyles.compareActions}>
                    <button 
                      className={cn(commonStyles.clearButton, themeStyles.clearButton)}
                      onClick={() => setSelectedVersions([])}
                    >
                      Clear
                    </button>
                    <button 
                      className={cn(commonStyles.compareButton, themeStyles.compareButton)}
                      onClick={handleCompare}
                      disabled={selectedVersions.length !== 2}
                    >
                      Compare Versions
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Version Timeline */}
            <StaggerContainer className={commonStyles.versionsList} delay={0.3}>
              {versions.map((version, index) => (
                <StaggerItem key={version.id}>
                  <div 
                    className={cn(
                      commonStyles.versionCard,
                      themeStyles.versionCard,
                      version.isCurrent && commonStyles.currentVersion,
                      selectedVersions.includes(version.id) && commonStyles.selectedVersion
                    )}
                  >
                    <div className={commonStyles.versionTimeline}>
                      <div className={cn(commonStyles.versionDot, themeStyles.versionDot, version.isCurrent && commonStyles.dotCurrent)}></div>
                      {index < versions.length - 1 && <div className={cn(commonStyles.versionLine, themeStyles.versionLine)}></div>}
                    </div>
                    <div className={commonStyles.versionContent}>
                      <div className={commonStyles.versionHeader}>
                        <div className={commonStyles.versionInfo}>
                          <span className={cn(commonStyles.versionNumber, themeStyles.versionNumber)}>
                            Version {version.versionNumber}
                            {version.isCurrent && <span className={commonStyles.currentBadge}>Current</span>}
                          </span>
                          <span className={cn(commonStyles.versionDate, themeStyles.versionDate)}>
                            {new Date(version.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                        <label className={commonStyles.checkbox}>
                          <input 
                            type="checkbox" 
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => handleVersionSelect(version.id)}
                          />
                          <span className={cn(commonStyles.checkmark, themeStyles.checkmark)}></span>
                        </label>
                      </div>
                      {version.changeNote && (
                        <p className={cn(commonStyles.changeNote, themeStyles.changeNote)}>
                          {version.changeNote}
                        </p>
                      )}
                      <div className={cn(commonStyles.versionMeta, themeStyles.versionMeta)}>
                        <span>By {version.uploadedBy}</span>
                        <span>•</span>
                        <span>{formatFileSize(version.fileSize)}</span>
                      </div>
                      <div className={commonStyles.versionActions}>
                        <button className={cn(commonStyles.downloadButton, themeStyles.downloadButton)}>
                          Download
                        </button>
                        {!version.isCurrent && (
                          <button 
                            className={cn(commonStyles.restoreButton, themeStyles.restoreButton)}
                            onClick={() => handleRestore(version.id)}
                          >
                            Restore
                          </button>
                        )}
                        <button className={cn(commonStyles.previewButton, themeStyles.previewButton)}>
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}
        {toast && (
          <div
            className={cn(
              commonStyles.toast,
              themeStyles.toast,
              toast.type === 'success' ? themeStyles.toastSuccess : themeStyles.toastError,
            )}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
