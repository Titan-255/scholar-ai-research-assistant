import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Send,
  Paperclip,
  Bot,
  Brain,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { Modal } from '../../components/ui/Modal';

export const ChatPage: React.FC = () => {
  const {
    pdfs,
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    createNewChat,
    isAiTyping,
    addToast,
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States
  const [inputText, setInputText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [selectedPdfId, setSelectedPdfId] = useState('');

  // Handle conversation matching via query parameter (?id=chat-1)
  useEffect(() => {
    const chatId = searchParams.get('id');
    if (chatId) {
      const match = conversations.find((c) => c.id === chatId);
      if (match) {
        setActiveConversationId(chatId);
      } else {
        addToast('error', 'Conversation not found');
        // fall back to first active chat or null
        if (conversations.length > 0) {
          setSearchParams({ id: conversations[0].id });
        } else {
          setActiveConversationId(null);
        }
      }
    } else if (conversations.length > 0) {
      // Auto select first chat
      setSearchParams({ id: conversations[0].id });
    } else {
      setActiveConversationId(null);
    }
  }, [searchParams, conversations]);

  // Scroll to bottom on messages change
  const activeChat = conversations.find((c) => c.id === activeConversationId);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isAiTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    if (!activeConversationId) {
      addToast('warning', 'Please select or start a chat first.');
      return;
    }
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleNewChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdfId) {
      addToast('error', 'Please select a document.');
      return;
    }
    const newChatId = await createNewChat(selectedPdfId);
    setIsNewChatModalOpen(false);
    setSelectedPdfId('');
    if (newChatId) {
      setSearchParams({ id: newChatId });
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (!activeConversationId) return;
    sendMessage(prompt);
  };

  const suggestedPrompts = [
    { label: 'Summarize Document', text: 'Summarize the core objectives and findings of this document.' },
    { label: 'Explain Methodology', text: 'Explain the key research methodology used in this paper.' },
    { label: 'List Limitations', text: 'What are the main limitations mentioned by the authors?' },
    { label: 'Formulas & Math', text: 'List the core formulas or scoring equations detailed in the text.' },
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8.5rem)] bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden shadow-soft">
        
        {/* Inner Chat History Sidebar */}
        <div className="hidden md:flex flex-col w-64 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 shrink-0">
          {/* New Chat Button Wrapper */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
            <Button
              variant="outline"
              className="w-full justify-start text-xs border-indigo-200 text-indigo-650 hover:bg-indigo-50/40"
              onClick={() => setIsNewChatModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>

          {/* Conversations History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">
              Conversations
            </span>
            {conversations.length > 0 ? (
              conversations.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSearchParams({ id: chat.id })}
                  className={`w-full flex items-start space-x-2.5 p-3 rounded-xl text-left text-xs transition-all ${
                    chat.id === activeConversationId
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold'
                      : 'text-slate-650 hover:bg-slate-50 dark:text-slate-450 dark:hover:bg-slate-900'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <div className="flex-1 overflow-hidden">
                    <span className="truncate block font-semibold text-slate-800 dark:text-slate-200">
                      {chat.pdfName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                      {chat.lastMessage}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs px-3">
                No active conversations. Start one below.
              </div>
            )}
          </div>
        </div>

        {/* Main Conversation Window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
          {activeChat ? (
            <>
              {/* Active Conversation header */}
              <div className="h-14 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between px-6 bg-slate-50/20 dark:bg-slate-900/10">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-600 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                      {activeChat.pdfName}
                    </h4>
                    <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                      Discussing paper contents in secure local runtime
                    </span>
                  </div>
                </div>

                {/* Mobile new chat shortcut */}
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden py-1 px-2.5 h-8 text-[11px]"
                  onClick={() => setIsNewChatModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Chat
                </Button>
              </div>

              {/* Message scroll viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeChat.messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}

                {/* AI Typing Indicator */}
                {isAiTyping && (
                  <div className="flex w-full space-x-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="shrink-0">
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                        <Bot className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        ScholarAI Assistant
                      </span>
                      {/* Typing dot animation */}
                      <div className="flex items-center space-x-1.5 py-2">
                        <div className="h-2 w-2 bg-indigo-600 rounded-full typing-dot" />
                        <div className="h-2 w-2 bg-indigo-600 rounded-full typing-dot" />
                        <div className="h-2 w-2 bg-indigo-600 rounded-full typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Suggested Prompts (shown if chat has only AI greet message) */}
              {activeChat.messages.length <= 1 && (
                <div className="px-6 py-2 grid grid-cols-2 gap-2.5 max-w-2xl mx-auto w-full">
                  {suggestedPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(item.text)}
                      className="p-3 text-left border border-slate-100 hover:border-indigo-200 bg-slate-50/30 hover:bg-indigo-50/20 dark:border-slate-800/80 dark:hover:border-slate-750 dark:bg-slate-900/30 rounded-xl transition-all group"
                    >
                      <span className="text-[11px] font-bold text-slate-750 dark:text-slate-200 block group-hover:text-indigo-600">
                        {item.label}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 block truncate">
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Message inputs form */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-900/10">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
                  <input
                    type="text"
                    placeholder="Ask anything about this document..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isAiTyping}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 pr-14 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-150 dark:placeholder-slate-550 transition-all shadow-sm"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isAiTyping}
                    className="absolute right-3.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                <div className="flex justify-center text-[10px] text-slate-400 mt-2">
                  <span>AI models can occasionally hallucinate references. Always verify page citations.</span>
                </div>
              </div>
            </>
          ) : (
            /* Empty state (No conversation loaded) */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="h-16 w-16 rounded-full bg-indigo-550/10 flex items-center justify-center text-indigo-600 animate-pulse">
                <Brain className="h-8 w-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-bold text-base text-slate-850 dark:text-white">Start a literature QA chat</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
                  You need to bind a PDF from your library to start an interactive chatbot dialogue.
                </p>
              </div>

              {pdfs.length > 0 ? (
                <Button variant="primary" size="sm" onClick={() => setIsNewChatModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Choose Document & Start
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
                  <Paperclip className="h-4 w-4 mr-1.5" />
                  Upload PDF First
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New chat selector modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Start New Discussion"
        size="md"
      >
        <form onSubmit={handleNewChatSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Indexed Document
            </label>
            {pdfs.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {pdfs.map((pdf) => (
                  <label
                    key={pdf.id}
                    className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                      selectedPdfId === pdf.id
                        ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20'
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <input
                        type="radio"
                        name="selectedPdf"
                        value={pdf.id}
                        checked={selectedPdfId === pdf.id}
                        onChange={() => setSelectedPdfId(pdf.id)}
                        className="h-4 w-4 text-indigo-650 focus:ring-indigo-550 dark:bg-slate-950 dark:border-slate-800"
                      />
                      <div className="overflow-hidden">
                        <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 block truncate max-w-xs">
                          {pdf.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Size: {pdf.size} | Status: {pdf.status}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed rounded-xl space-y-3">
                <AlertCircle className="h-6 w-6 text-slate-350 mx-auto" />
                <p className="text-xs text-slate-450">No documents in library to chat with</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
                  Upload PDF
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-105">
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={() => setIsNewChatModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="sm"
              disabled={!selectedPdfId}
            >
              Start Chat
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
export default ChatPage;
