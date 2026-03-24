// @AI-HINT: This component provides a theme-aware interface for file sharing. It uses global CSS variables for all colors and styles, ensuring perfect integration with the application's current theme.
'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import Button from '@/app/components/Button/Button';
import { cn } from '@/lib/utils';
import { uploadsApi } from '@/lib/api';
import commonStyles from './FileShareComponent.common.module.css';
import lightStyles from './FileShareComponent.light.module.css';
import darkStyles from './FileShareComponent.dark.module.css';

const FileShareComponent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendFile = async () => {
    if (selectedFile) {
      setUploading(true);
      setError(null);
      try {
        await uploadsApi.upload('document', selectedFile);
        setSelectedFile(null);
      } catch (err: any) {
        setError(err.message || 'Failed to upload file');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <label htmlFor="file-upload" className={commonStyles.visuallyHidden}>Upload file</label>
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className={commonStyles.visuallyHidden}
      />
      {!selectedFile ? (
        <Button variant="secondary" onClick={handleButtonClick}>Share File</Button>
      ) : (
        <div className={cn(commonStyles.preview, themeStyles.preview)}>
          <span className={cn(commonStyles.fileName, themeStyles.fileName)}>{selectedFile.name}</span>
          <div className={commonStyles.actions}>
            <Button variant="primary" size="sm" onClick={handleSendFile}>Send</Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedFile(null)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileShareComponent;
