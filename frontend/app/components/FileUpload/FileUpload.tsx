// @AI-HINT: FileUpload component for drag-and-drop file uploads with progress tracking, security validation, and accessibility
'use client';

import { useState, useRef, useId, DragEvent, ChangeEvent, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { CloudUpload, X, CheckCircle, Loader2 } from 'lucide-react';
import Button from '@/app/components/Button/Button';

import commonStyles from './FileUpload.common.module.css';
import lightStyles from './FileUpload.light.module.css';
import darkStyles from './FileUpload.dark.module.css';

import api from '@/lib/api';

// Security: Define allowed MIME types explicitly
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'image/*': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  'application/pdf': ['application/pdf'],
  'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Security: Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.js', '.jse', '.vbs', '.vbe',
  '.ws', '.wsf', '.wsc', '.wsh', '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',
  '.msh', '.msh1', '.msh2', '.mshxml', '.msh1xml', '.msh2xml', '.scf', '.lnk', '.inf',
  '.reg', '.dll', '.cpl', '.msc', '.jar', '.hta', '.htm', '.html', '.php', '.asp', '.aspx',
];

interface FileUploadProps {
  /** Label for the upload field */
  label?: string;
  /** Accepted file types (MIME pattern) */
  accept?: string;
  /** Maximum file size in MB */
  maxSize?: number;
  /** Type of upload for API endpoint */
  uploadType: 'avatar' | 'portfolio' | 'document';
  /** Callback when upload completes successfully */
  onUploadComplete?: (url: string) => void;
  /** External error message */
  error?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether multiple files are allowed */
  multiple?: boolean;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/*',
  maxSize = 10,
  uploadType,
  onUploadComplete,
  error,
  className,
  multiple = false,
  required = false,
  disabled = false,
}) => {
  const componentId = useId();
  const inputId = `${componentId}-input`;
  const errorId = `${componentId}-error`;
  const { resolvedTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const hasError = !!(error || uploadError);

  const styles = {
    container: cn(commonStyles.container, themeStyles.container, className),
    label: cn(commonStyles.label, themeStyles.label),
    dropzone: cn(
      commonStyles.dropzone,
      themeStyles.dropzone,
      isDragging && commonStyles.dropzoneDragging,
      isDragging && themeStyles.dropzoneDragging,
      hasError && commonStyles.dropzoneError,
      hasError && themeStyles.dropzoneError,
      disabled && commonStyles.dropzoneDisabled
    ),
    icon: cn(commonStyles.icon, themeStyles.icon),
    text: cn(commonStyles.text, themeStyles.text),
    hint: cn(commonStyles.hint, themeStyles.hint),
    progress: cn(commonStyles.progress, themeStyles.progress),
    progressBar: cn(commonStyles.progressBar, themeStyles.progressBar),
    success: cn(commonStyles.success, themeStyles.success),
    error: cn(commonStyles.error, themeStyles.error),
    preview: cn(commonStyles.preview, themeStyles.preview),
  };

  // Security: Validate file type and extension
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Security: Check for dangerous extensions
    const fileName = file.name.toLowerCase();
    const hasDangerousExtension = DANGEROUS_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (hasDangerousExtension) {
      return 'This file type is not allowed for security reasons';
    }

    // Security: Validate MIME type against allowed types
    const allowedMimes = ALLOWED_MIME_TYPES[accept] || [];
    if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
      // Also check if it matches the pattern (e.g., image/*)
      const mimePattern = accept.replace('*', '');
      if (!file.type.startsWith(mimePattern)) {
        return `Invalid file type. Please upload ${accept}`;
      }
    }

    // Security: Double-check file extension matches MIME type
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    const mimeToExtension: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    };
    
    const expectedExtensions = mimeToExtension[file.type];
    if (expectedExtensions && !expectedExtensions.includes(extension)) {
      return 'File extension does not match file type';
    }

    return null; // Valid
  }, [accept, maxSize]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const data = await api.uploads.upload(uploadType, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadedUrl(data.url);
      onUploadComplete?.(data.url);
    } catch (err) {
      // Security: Don't expose internal error details
      const message = err instanceof Error ? err.message : 'An error occurred during upload';
      setUploadError(message.includes('network') ? 'Network error. Please try again.' : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };


  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={commonStyles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      
      {!uploadedUrl ? (
        <div
          className={styles.dropzone}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Upload ${uploadType}. ${accept} files up to ${maxSize}MB`}
          aria-describedby={hasError ? errorId : undefined}
          aria-disabled={disabled}
          aria-busy={uploading}
        >
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            multiple={multiple}
            required={required}
            disabled={disabled}
            className={commonStyles.hiddenInput}
            aria-label={`Upload ${uploadType} file`}
          />
          
          {uploading ? (
            <div className={styles.progress} role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <Loader2 className="animate-spin" size={48} aria-hidden="true" />
              <div className={styles.progressBar}>
                <div style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className={styles.text}>Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <>
              <CloudUpload className={styles.icon} size={48} aria-hidden="true" />
              <p className={styles.text}>
                Drag and drop your file here, or click to browse
              </p>
              <p className={styles.hint}>
                Max file size: {maxSize}MB | Accepted: {accept}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.success} role="status" aria-live="polite">
          <CheckCircle size={24} className="text-green-500" aria-hidden="true" />
          <span>File uploaded successfully!</span>
          <Button variant="danger" size="sm" onClick={handleRemove} aria-label="Remove uploaded file">
            <X size={16} aria-hidden="true" /> Remove
          </Button>
          {uploadType !== 'document' && (
            <div className={styles.preview}>
              <img src={uploadedUrl} alt="Uploaded file preview" />
            </div>
          )}
        </div>
      )}

      {hasError && (
        <div id={errorId} className={styles.error} role="alert" aria-live="assertive">
          {error || uploadError}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
