import React from 'react';
import { FileText, MessageSquare, Trash2, Calendar, HardDrive } from 'lucide-react';
import type { PDFFile } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PDFCardProps {
  pdf: PDFFile;
  onChat: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PDFCard: React.FC<PDFCardProps> = ({ pdf, onChat, onDelete }) => {
  const getBadgeVariant = (status: PDFFile['status']) => {
    if (['Indexed', 'Ready', 'Completed'].includes(status)) {
      return 'success';
    }
    if (status === 'Failed') {
      return 'error';
    }
    return 'warning';
  };

  return (
    <Card hoverEffect className="relative overflow-hidden group">
      <CardContent className="space-y-4">
        {/* Header Title & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2.5 rounded-xl text-indigo-600 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {pdf.name}
              </h4>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-0.5" />
                  {pdf.uploadDate}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <HardDrive className="h-3 w-3 mr-0.5" />
                  {pdf.size}
                </span>
              </div>
            </div>
          </div>

          <Badge variant={getBadgeVariant(pdf.status)}>
            {pdf.status}
          </Badge>
        </div>

        {/* Progress bar for background processing */}
        {!['Ready', 'Indexed', 'Completed', 'Failed'].includes(pdf.status) && pdf.progress !== undefined && (
          <div className="space-y-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${pdf.progress}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 text-right">{pdf.progress}% processed</div>
          </div>
        )}

        {/* Info stats */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50 dark:border-slate-800/50 text-xs font-semibold text-slate-500">
          <div>
            <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Queries</span>
            <span className="text-slate-700 dark:text-slate-200">{pdf.questionsCount}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Active Chats</span>
            <span className="text-slate-700 dark:text-slate-200">{pdf.totalChats}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2 pt-1.5">
          <Button
            variant={['Indexed', 'Ready', 'Completed'].includes(pdf.status) ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onChat(pdf.id)}
            disabled={!['Ready', 'Indexed', 'Completed'].includes(pdf.status)}
            className="flex-1"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Chat
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(pdf.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export default PDFCard;
