import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, PDFFile, Conversation, Message, ToastMessage } from '../types';

interface AppContextType {
  user: User | null;
  theme: 'light' | 'dark';
  language: string;
  pdfs: PDFFile[];
  conversations: Conversation[];
  activeConversationId: string | null;
  toasts: ToastMessage[];
  isAiTyping: boolean;
  storageProvider: string;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string, email: string) => void;
  uploadPdf: (file: File) => Promise<void>;
  deletePdf: (id: string) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
  sendMessage: (text: string) => void;
  setActiveConversationId: (id: string | null) => void;
  createNewChat: (pdfId: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:8000/api/v1";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ar_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ar_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [language, setLanguageState] = useState<string>('English');
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [storageProvider, setStorageProvider] = useState<string>('LOCAL');

  // Sync theme with DOM on state change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ar_theme', theme);
  }, [theme]);

  // Sync user object with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('ar_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ar_user');
    }
  }, [user]);

  // Helper Toast Actions
  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('ar_access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
      ...options.headers,
      ...getAuthHeaders(),
    };
    
    let res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      logger("Token expired, attempting refresh...");
      const refreshToken = localStorage.getItem('ar_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          const refreshJson = await refreshRes.json();
          if (refreshRes.ok && refreshJson.success) {
            localStorage.setItem('ar_access_token', refreshJson.data.access_token);
            // Retry the original request
            const retryHeaders = {
              ...options.headers,
              'Authorization': `Bearer ${refreshJson.data.access_token}`,
            };
            res = await fetch(url, { ...options, headers: retryHeaders });
          } else {
            logout();
          }
        } catch (err) {
          console.error("Token refresh network error:", err);
          logout();
        }
      } else {
        logout();
      }
    }
    
    return res;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 1. Fetch PDFs
  const fetchPdfs = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/files`);
      const json = await res.json();
      if (res.ok && json.success) {
        const mapped: PDFFile[] = json.data.map((item: any) => ({
          id: item.id,
          name: item.original_name,
          size: formatBytes(item.size_bytes),
          sizeBytes: item.size_bytes,
          uploadDate: item.upload_time.split(" ")[0],
          status: item.status,
          questionsCount: 0,
          totalChats: 0,
        }));
        setPdfs(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch PDFs from backend:", err);
    }
  };

  // 2. Fetch Chat Sessions
  const fetchConversations = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/chat/sessions`);
      const json = await res.json();
      if (res.ok && json.success) {
        const mapped: Conversation[] = json.data.map((s: any) => ({
          id: s.uuid,
          pdfId: '', 
          pdfName: s.title,
          messages: [],
          lastMessage: 'Open conversation to discuss document.',
          date: s.created_at.split('T')[0],
        }));
        setConversations(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  // 3. Fetch User Settings
  const fetchSettings = async () => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/settings`);
      const json = await res.json();
      if (res.ok && json.success) {
        setThemeState(json.data.theme as 'light' | 'dark');
        setLanguageState(json.data.language);
        setStorageProvider(json.data.storage_provider || 'LOCAL');
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  // 4. Update Settings helper
  const updateSettingsOnBackend = async (newTheme: string, newLang: string) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme, language: newLang }),
      });
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (user) {
      updateSettingsOnBackend(newTheme, language);
    }
  };

  const setLanguage = (newLang: string) => {
    setLanguageState(newLang);
    if (user) {
      updateSettingsOnBackend(theme, newLang);
    }
  };

  // Sync stats and details on mount and when user login shifts
  useEffect(() => {
    if (user) {
      fetchPdfs();
      fetchConversations();
      fetchSettings();
    } else {
      setPdfs([]);
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [user ? user.email : null]);

  // Load detailed messages when active conversation shifts
  useEffect(() => {
    if (activeConversationId && user) {
      const loadMessages = async () => {
        try {
          const res = await authenticatedFetch(`${API_BASE_URL}/chat/session/${activeConversationId}`);
          const json = await res.json();
          if (res.ok && json.success) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      pdfName: json.data.title,
                      messages: json.data.messages.map((m: any) => ({
                        id: m.uuid,
                        sender: m.sender,
                        text: m.message,
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      })),
                      lastMessage: json.data.messages.length > 0 ? json.data.messages[json.data.messages.length - 1].message : 'Open conversation to discuss document.'
                    }
                  : c
              )
            );
          }
        } catch (err) {
          console.error("Failed to load session details:", err);
        }
      };
      loadMessages();
    }
  }, [activeConversationId]);

  // Synchronize user storage capacity metrics
  useEffect(() => {
    if (user) {
      const bytes = pdfs.reduce((sum, p) => sum + p.sizeBytes, 0);
      const mb = parseFloat((bytes / (1024 * 1024)).toFixed(1));
      if (user.storageUsed !== mb) {
        setUser((prev) => prev ? { ...prev, storageUsed: mb } : null);
      }
    }
  }, [pdfs]);

  // Auth Operations
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        localStorage.setItem('ar_access_token', json.data.access_token);
        localStorage.setItem('ar_refresh_token', json.data.refresh_token);
        
        const mapped: User = {
          name: json.data.user.full_name,
          email: json.data.user.email,
          avatar: json.data.user.profile_picture || '',
          storageUsed: 0.0,
          maxStorage: 100.0,
          joinedDate: json.data.user.created_at.split('T')[0],
        };
        setUser(mapped);
        addToast('success', `Welcome back, ${mapped.name}!`);
        return true;
      } else {
        addToast('error', json.message || 'Invalid email or password.');
        return false;
      }
    } catch (err) {
      console.error("Login connection error:", err);
      addToast('error', 'Failed to connect to authentication server.');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        localStorage.setItem('ar_access_token', json.data.access_token);
        localStorage.setItem('ar_refresh_token', json.data.refresh_token);
        
        const mapped: User = {
          name: json.data.user.full_name,
          email: json.data.user.email,
          avatar: json.data.user.profile_picture || '',
          storageUsed: 0.0,
          maxStorage: 100.0,
          joinedDate: json.data.user.created_at.split('T')[0],
        };
        setUser(mapped);
        addToast('success', 'Account registered successfully!');
        return true;
      } else {
        addToast('error', json.message || 'Registration failed.');
        return false;
      }
    } catch (err) {
      console.error("Registration connection error:", err);
      addToast('error', 'Failed to connect to authentication server.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('ar_access_token');
    localStorage.removeItem('ar_refresh_token');
    localStorage.removeItem('ar_user');
    localStorage.removeItem('ar_active_chat');
    setUser(null);
    setPdfs([]);
    setConversations([]);
    setActiveConversationId(null);
    addToast('info', 'Logged out successfully');
  };

  const updateProfile = async (name: string, email: string) => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUser((prev) => {
          if (!prev) return null;
          return { ...prev, name: json.data.full_name, email: json.data.email };
        });
        addToast('success', 'Profile updated successfully');
      } else {
        addToast('error', json.message || 'Profile update failed.');
      }
    } catch (err) {
      console.error("Profile update error:", err);
      addToast('error', 'Failed to connect to profile server.');
    }
  };

  // PDF Catalog Operations
  const uploadPdf = async (file: File) => {
    const sizeMb = file.size / (1024 * 1024);
    if (user && user.storageUsed + sizeMb > user.maxStorage) {
      addToast('error', 'Upload failed: Storage limit exceeded.');
      return;
    }

    addToast('info', `Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addToast('success', `${file.name} uploaded successfully!`);
        await fetchPdfs();
      } else {
        addToast('error', `Upload failed: ${json.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      addToast('error', 'Failed to connect to backend server.');
    }
  };

  const deletePdf = async (id: string) => {
    const targetFile = pdfs.find((p) => p.id === id);
    if (!targetFile) return;

    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/files/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addToast('success', `${targetFile.name} deleted successfully`);
        // Clean conversations associated with this PDF from memory
        setConversations((prev) => prev.filter((c) => c.pdfId !== id));
        if (activeConversationId) {
          const activeChat = conversations.find((c) => c.id === activeConversationId);
          if (activeChat && activeChat.pdfId === id) {
            setActiveConversationId(null);
          }
        }
        await fetchPdfs();
      } else {
        addToast('error', `Delete failed: ${json.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      addToast('error', 'Failed to connect to backend server.');
    }
  };

  // Chat/Conversation Operations
  const createNewChat = async (pdfId: string): Promise<string> => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_id: pdfId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('info', 'Started new conversation');
        await fetchConversations();
        return json.data.uuid;
      } else {
        addToast('error', json.message || 'Failed to start chat.');
        return '';
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
      addToast('error', 'Failed to connect to chat server.');
      return '';
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/chat/session/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        addToast('success', 'Conversation deleted successfully.');
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null);
        }
      } else {
        addToast('error', json.message || 'Failed to delete conversation.');
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      addToast('error', 'Failed to connect to server.');
    }
  };

  const sendMessage = async (text: string) => {
    if (!activeConversationId) return;

    const tempId = 'temp-' + Math.random().toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: tempId,
      sender: 'user',
      text,
      timestamp,
    };
    
    // Append optimistically
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: text,
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );

    setIsAiTyping(true);

    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeConversationId,
          message: text,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const mappedMessages = json.data.map((m: any) => ({
          id: m.uuid,
          sender: m.sender,
          text: m.message,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: mappedMessages[1].text,
                  messages: [
                    ...c.messages.filter((m) => m.id !== tempId),
                    ...mappedMessages
                  ],
                }
              : c
          )
        );
      } else {
        addToast('error', json.message || 'Failed to send message.');
      }
    } catch (err) {
      console.error("Error sending message:", err);
      addToast('error', 'Failed to connect to chat server.');
    } finally {
      setIsAiTyping(false);
    }
  };

  const logger = (msg: string) => {
    console.log(`[ScholarAI AppContext] ${msg}`);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        theme,
        language,
        pdfs,
        conversations,
        activeConversationId,
        toasts,
        isAiTyping,
        login,
        register,
        logout,
        updateProfile,
        uploadPdf,
        deletePdf,
        addToast,
        removeToast,
        sendMessage,
        setActiveConversationId,
        createNewChat,
        deleteConversation,
        setTheme,
        setLanguage,
        storageProvider,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
