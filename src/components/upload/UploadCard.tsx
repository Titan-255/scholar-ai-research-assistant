import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';

export const UploadCard: React.FC = () => {
  const { uploadPdf, addToast, storageProvider } = useApp();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      addToast('error', 'Unsupported format: Only PDF files are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      addToast('error', 'File size exceeds 10 MB limit.');
      return;
    }

    uploadPdf(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card
      className={`border-2 border-dashed transition-all duration-300 ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 scale-[0.99]'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-350 dark:hover:border-slate-700'
      }`}
    >
      <CardContent className="py-10">
        <form
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center text-center space-y-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleChange}
          />

          <div className={`p-4 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-550 transition-colors ${
            isDragActive ? 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20' : ''
          }`}>
            <UploadCloud className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drag and drop your PDF here, or{' '}
              <button
                type="button"
                onClick={onButtonClick}
                className="text-indigo-600 dark:text-indigo-405 hover:underline font-bold"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-slate-450 dark:text-slate-500">
              PDF formats only (Max. 10 MB)
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
            <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Files are encrypted end-to-end and stored in {storageProvider === 'S3' ? 'AWS S3 Cloud' : 'Local Workspace'}</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
export default UploadCard;
