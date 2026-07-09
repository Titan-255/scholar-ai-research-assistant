export interface User {
  name: string;
  email: string;
  avatar: string;
  storageUsed: number; // in MB
  maxStorage: number;  // in MB
  joinedDate: string;
}

export type PDFStatus = 'Ready' | 'Processing' | 'Indexed' | 'Queued' | 'Downloading' | 'Reading Metadata' | 'Extracting Text' | 'Running OCR' | 'Cleaning Text' | 'Saving Pages' | 'Completed' | 'Failed';

export interface PDFFile {
  id: string;
  name: string;
  size: string; // formatted size e.g. "2.4 MB"
  sizeBytes: number;
  uploadDate: string;
  status: PDFStatus;
  questionsCount: number;
  totalChats: number;
  progress?: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  pdfId: string;
  pdfName: string;
  messages: Message[];
  lastMessage: string;
  date: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
