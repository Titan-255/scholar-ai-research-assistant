import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  UploadCloud,
  Database,
  Plus,
  ArrowRight,
  TrendingUp,
  Brain,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { PDFCard } from '../../components/dashboard/PDFCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/common/SearchBar';

export const DashboardPage: React.FC = () => {
  const { pdfs, conversations, createNewChat, deletePdf, user } = useApp();
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState('');

  // Calculate statistics metrics
  const totalPdfs = pdfs.length;
  const totalChats = conversations.length;
  const totalQuestions = pdfs.reduce((sum, item) => sum + item.questionsCount, 0);
  const storageUsed = user?.storageUsed || 0;
  const maxStorage = user?.maxStorage || 100;
  const storagePercentage = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

  // Filter recent PDFs
  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleChatStart = (pdfId: string) => {
    // Check if conversation already exists for this PDF
    const existing = conversations.find((c) => c.pdfId === pdfId);
    if (existing) {
      navigate(`/chat?id=${existing.id}`);
    } else {
      const chatId = createNewChat(pdfId);
      if (chatId) navigate(`/chat?id=${chatId}`);
    }
  };

  const handleQuickUpload = () => {
    navigate('/upload');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.name || 'Researcher'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Analyze academic literature and manuals using integrated AI.
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={handleQuickUpload}>
            <Plus className="h-4 w-4 mr-1.5" />
            Upload PDF
          </Button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="PDFs Uploaded"
            value={totalPdfs}
            subtext="Academic / manuals vault"
            icon={FileText}
            color="indigo"
          />
          <StatCard
            title="Questions Asked"
            value={totalQuestions}
            subtext="Semantic document lookups"
            icon={Brain}
            color="violet"
          />
          <StatCard
            title="Total Chats"
            value={totalChats}
            subtext="AI context threads"
            icon={MessageSquare}
            color="cyan"
          />
          <StatCard
            title="Storage Used"
            value={`${storageUsed} MB`}
            subtext={`${storagePercentage}% of maximum quota`}
            icon={Database}
            color="emerald"
          />
        </div>

        {/* Middle split: Recent Files & Sidebars widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main recent files */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                My PDF Library
              </h3>
              
              <SearchBar
                placeholder="Search library..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>

            {filteredPdfs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPdfs.map((pdf) => (
                  <PDFCard
                    key={pdf.id}
                    pdf={pdf}
                    onChat={handleChatStart}
                    onDelete={deletePdf}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12 border-dashed">
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-full border border-slate-100 dark:border-slate-800 text-slate-400">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No PDFs found
                    </p>
                    <p className="text-xs text-slate-450 dark:text-slate-400">
                      {filterQuery ? 'No results match your filter query' : 'Upload your first document to start chatting.'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleQuickUpload}>
                    <UploadCloud className="h-4 w-4 mr-1.5" />
                    Upload PDF
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar utilities */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <button
                  onClick={handleQuickUpload}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/80 dark:border-slate-800 rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-650 shrink-0">
                      <UploadCloud className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        Upload Document
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Add PDF to library
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/chat')}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/80 dark:border-slate-800 rounded-xl text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-violet-50 dark:bg-violet-950/40 p-2 rounded-lg text-violet-650 shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        Start AI Chat
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Discuss paper details
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </CardContent>
            </Card>

            {/* Storage Usage Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Storage Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-350">MemSpace Occupancy</span>
                  <span className="text-indigo-650">{storagePercentage}%</span>
                </div>

                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{storageUsed.toFixed(1)} MB occupied</span>
                  <span>{maxStorage} MB limit</span>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-xl flex items-start space-x-2 text-[10px] text-indigo-700 dark:text-indigo-400 leading-normal">
                  <TrendingUp className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span>
                    <strong>Storage Efficiency</strong>: scholar-indexing keeps memory footprints low. Upgrade to get unlimited PDF storage capacities.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default DashboardPage;
