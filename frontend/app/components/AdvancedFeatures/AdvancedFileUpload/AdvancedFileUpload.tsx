// @AI-HINT: Advanced file upload component with drag-and-drop, preview, progress tracking, and multiple file support
'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  CloudUpload,
  File,
  Image,
  FileText,
  Sheet,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import commonStyles from './AdvancedFileUpload.common.module.css';
import lightStyles from './AdvancedFileUpload.light.module.css';
import darkStyles from './AdvancedFileUpload.dark.module.css';

export interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
  preview?: string;
}

interface AdvancedFileUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onUpload: (files: File[]) => Promise<{ url: string; id: string }[]>;
  onRemove?: (fileId: string) => void;
  className?: string;
  showPreviews?: boolean;
  multiple?: boolean;
}

const fileIcons: Record<string, React.ElementType> = {
  'image/': Image,
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml': FileText,
  'application/vnd.ms-excel': Sheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml': Sheet,
};

const getFileIcon = (mimeType: string): React.ElementType => {
  for (const [key, Icon] of Object.entries(fileIcons)) {
    if (mimeType.startsWith(key)) return Icon;
  }
  return File;
};

export default function AdvancedFileUpload({
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
  onUpload,
  onRemove,
  className,
  showPreviews = true,
  multiple = true,
}: AdvancedFileUploadProps) {
  const { resolvedTheme } = useTheme();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return {
      container: cn(commonStyles.container, themeStyles.container),
      dropzone: cn(commonStyles.dropzone, themeStyles.dropzone),
      dropzoneDragging: cn(commonStyles.dropzoneDragging, themeStyles.dropzoneDragging),
      dropzoneIcon: cn(commonStyles.dropzoneIcon, themeStyles.dropzoneIcon),
      dropzoneText: cn(commonStyles.dropzoneText, themeStyles.dropzoneText),
      dropzoneSubtext: cn(commonStyles.dropzoneSubtext, themeStyles.dropzoneSubtext),
      browseButton: cn(commonStyles.browseButton, themeStyles.browseButton),
      fileList: cn(commonStyles.fileList, themeStyles.fileList),
      fileItem: cn(commonStyles.fileItem, themeStyles.fileItem),
      filePreview: cn(commonStyles.filePreview, themeStyles.filePreview),
      fileIcon: cn(commonStyles.fileIcon, themeStyles.fileIcon),
      fileInfo: cn(commonStyles.fileInfo, themeStyles.fileInfo),
      fileName: cn(commonStyles.fileName, themeStyles.fileName),
      fileSize: cn(commonStyles.fileSize, themeStyles.fileSize),
      fileProgress: cn(commonStyles.fileProgress, themeStyles.fileProgress),
      progressBar: cn(commonStyles.progressBar, themeStyles.progressBar),
      progressFill: cn(commonStyles.progressFill, themeStyles.progressFill),
      fileStatus: cn(commonStyles.fileStatus, themeStyles.fileStatus),
      removeButton: cn(commonStyles.removeButton, themeStyles.removeButton),
      errorText: cn(commonStyles.errorText, themeStyles.errorText),
    };
  }, [resolvedTheme]);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return `File size exceeds ${maxSizeMB}MB`;
      }

      // Check file type
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType);
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return `File type not accepted. Accepted types: ${acceptedTypes.join(', ')}`;
      }

      return null;
    },
    [maxSizeMB, acceptedTypes]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);

      // Check max files limit
      if (uploadedFiles.length + fileArray.length > maxFiles) {
        setToast({ message: `Maximum ${maxFiles} files allowed`, type: 'error' });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      // Validate and prepare files
      const validFiles: UploadedFile[] = [];
      for (const file of fileArray) {
        const error = validateFile(file);
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Generate preview for images
        let preview: string | undefined;
        if (file.type.startsWith('image/') && showPreviews) {
          preview = URL.createObjectURL(file);
        }

        validFiles.push({
          id: fileId,
          file,
          status: error ? 'error' : 'pending',
          progress: 0,
          error: error ?? undefined,
          preview,
        });
      }

      setUploadedFiles((prev) => [...prev, ...validFiles]);

      // Upload valid files
      const filesToUpload = validFiles.filter((f) => f.status === 'pending');
      if (filesToUpload.length > 0) {
        uploadFiles(filesToUpload);
      }
    },
    [uploadedFiles.length, maxFiles, validateFile, showPreviews]
  );

  const uploadFiles = async (files: UploadedFile[]) => {
    // Mark files as uploading
    setUploadedFiles((prev) =>
      prev.map((f) => (files.find((uf) => uf.id === f.id) ? { ...f, status: 'uploading' as const } : f))
    );

    try {
      const fileObjects = files.map((f) => f.file);
      const results = await onUpload(fileObjects);

      // Update files with URLs
      setUploadedFiles((prev) =>
        prev.map((f) => {
          const result = results.find((r) => r.id === f.id);
          if (result) {
            return { ...f, status: 'success' as const, progress: 100, url: result.url };
          }
          return f;
        })
      );
    } catch (error: any) {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          files.find((uf) => uf.id === f.id)
            ? { ...f, status: 'error' as const, error: error.message || 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFiles]
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      const file = uploadedFiles.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      onRemove?.(fileId);
    },
    [uploadedFiles, onRemove]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn(styles.container, className)}>
      <div
        className={cn(styles.dropzone, isDragging && styles.dropzoneDragging)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload className={styles.dropzoneIcon} size={48} />
        <p className={styles.dropzoneText}>
          Drag and drop {multiple ? 'files' : 'a file'} here, or{' '}
          <span className={styles.browseButton}>browse</span>
        </p>
        <p className={styles.dropzoneSubtext}>
          Max {maxFiles} files, {maxSizeMB}MB each • {acceptedTypes.join(', ')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className={commonStyles.hiddenInput}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className={styles.fileList}>
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.file.type);
            return (
              <div key={file.id} className={styles.fileItem}>
                {file.preview ? (
                  <img src={file.preview} alt={file.file.name} className={styles.filePreview} />
                ) : (
                  <div className={styles.fileIcon}>
                    <FileIcon />
                  </div>
                )}

                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.file.name}</div>
                  <div className={styles.fileSize}>{formatFileSize(file.file.size)}</div>

                  {file.status === 'uploading' && (
                    <div className={styles.fileProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {file.error && <div className={styles.errorText}>{file.error}</div>}
                </div>

                <div className={styles.fileStatus}>
                  {file.status === 'uploading' && <Loader2 size={16} className="animate-spin" />}
                  {file.status === 'success' && <Check size={16} className={commonStyles.successIcon} />}
                  {file.status === 'error' && <X size={16} className={commonStyles.errorIcon} />}
                </div>

                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className={styles.removeButton}
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.75rem',
          borderRadius: '14px', fontWeight: 600, zIndex: 200,
          background: toast.type === 'error' ? 'rgba(232,17,35,0.1)' : 'rgba(39,174,96,0.1)',
          color: toast.type === 'error' ? '#e81123' : '#27AE60',
          border: `1px solid ${toast.type === 'error' ? 'rgba(232,17,35,0.3)' : 'rgba(39,174,96,0.3)'}`,
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
