import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UploadCard } from '../../components/upload/UploadCard';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/common/SearchBar';
import type { PDFFile } from '../../types';

export const UploadPage: React.FC = () => {
  const { pdfs, deletePdf, createNewChat, conversations } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preview modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null);

  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChat = (pdfId: string) => {
    const existing = conversations.find((c) => c.pdfId === pdfId);
    if (existing) {
      navigate(`/chat?id=${existing.id}`);
    } else {
      const chatId = createNewChat(pdfId);
      if (chatId) navigate(`/chat?id=${chatId}`);
    }
  };

  const handlePreview = (pdf: PDFFile) => {
    setSelectedPdf(pdf);
    setIsPreviewOpen(true);
  };

  const getStatusIcon = (status: PDFFile['status']) => {
    if (['Indexed', 'Ready', 'Completed'].includes(status)) {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
    if (status === 'Failed') {
      return <AlertCircle className="h-4 w-4 text-rose-500" />;
    }
    return <Clock className="h-4 w-4 text-amber-500 animate-spin" />;
  };

  const getStatusVariant = (status: PDFFile['status']) => {
    if (['Indexed', 'Ready', 'Completed'].includes(status)) {
      return 'success';
    }
    if (status === 'Failed') {
      return 'error';
    }
    return 'warning';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Upload & Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Feed research PDFs to the AI engine to compile index summaries.
          </p>
        </div>

        {/* Upload widget */}
        <UploadCard />

        {/* Files library section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
              Document Catalog ({pdfs.length})
            </h3>
            
            <SearchBar
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredPdfs.length > 0 ? (
            <Card className="overflow-hidden p-0 border-slate-100 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      <th className="px-6 py-4">Filename</th>
                      <th className="px-6 py-4">Upload Date</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {filteredPdfs.map((pdf) => (
                      <tr
                        key={pdf.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition-colors group"
                      >
                        {/* Filename cell */}
                        <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <FileText className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[200px] sm:max-w-xs">{pdf.name}</span>
                          </div>
                        </td>

                        {/* Upload Date cell */}
                        <td className="px-6 py-4 text-slate-500">{pdf.uploadDate}</td>

                        {/* Size cell */}
                        <td className="px-6 py-4 text-slate-500">{pdf.size}</td>

                        {/* Status cell */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1.5 min-w-[120px]">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(pdf.status)}
                              <Badge variant={getStatusVariant(pdf.status)}>{pdf.status}</Badge>
                            </div>
                            {!['Ready', 'Indexed', 'Completed', 'Failed'].includes(pdf.status) && pdf.progress !== undefined && (
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${pdf.progress}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Action buttons cell */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(pdf)}
                              className="h-8 py-0 px-2.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline ml-1">Preview</span>
                            </Button>
                            
                            <Button
                              variant={['Indexed', 'Ready', 'Completed'].includes(pdf.status) ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => handleChat(pdf.id)}
                              disabled={!['Ready', 'Indexed', 'Completed'].includes(pdf.status)}
                              className="h-8 py-0 px-2.5"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline ml-1">Chat</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePdf(pdf.id)}
                              className="text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No documents found</p>
                <p className="text-xs text-slate-400">Search query returned zero items.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Extracted preview modal */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Document Metadata & Extract Preview`}
          size="lg"
        >
          {selectedPdf && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">{selectedPdf.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 pt-1">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Status</span>
                    <span className="text-indigo-650">{selectedPdf.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">File Space</span>
                    <span className="text-slate-700 dark:text-slate-200">{selectedPdf.size}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-450">
                  Extracted Abstract Snippet
                </h5>
                <div className="h-44 overflow-y-auto border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 text-xs font-mono leading-relaxed text-slate-600 dark:text-slate-350">
                  {selectedPdf.status === 'Processing' ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                      <Clock className="h-6 w-6 text-amber-500 animate-spin" />
                      <span className="text-[11px] font-semibold text-slate-400">Compiling index data structure...</span>
                    </div>
                  ) : (
                    <>
                      <strong>[ABSTRACT]</strong> This document introduces a scalable vector-indexed neural retrieval schema. 
                      By parsing unstructured document objects into localized context blocks, we show linear search times 
                      with constant overhead scaling.
                      <br /><br />
                      <strong>[METHODOLOGY]</strong> Paragraph nodes are formatted with absolute positional markers. 
                      Subsequent QA queries evaluate similarities using standard dot products over token blocks, 
                      providing high citation precision values (Acc=94.2%).
                      <br /><br />
                      <strong>[KEYWORD DESCRIPTORS]</strong> Self-Attention, Vector Indexing, Neural Retrieval, Literature Compiling.
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleChat(selectedPdf.id);
                  }}
                  disabled={!['Ready', 'Indexed', 'Completed'].includes(selectedPdf.status)}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Discuss document
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
export default UploadPage;
