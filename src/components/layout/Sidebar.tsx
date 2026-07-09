import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  UploadCloud,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout, conversations } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My PDFs / Upload', path: '/upload', icon: UploadCloud },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare },
  ];

  const footerItems = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Storage calculations
  const storageUsed = user?.storageUsed || 0;
  const maxStorage = user?.maxStorage || 100;
  const storagePercentage = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-35 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2 rounded-xl text-white shrink-0 shadow-md shadow-indigo-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            {isOpen && (
              <span className="font-bold text-base bg-gradient-to-r from-indigo-600 to-violet-650 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400 whitespace-nowrap">
                ScholarAI
              </span>
            )}
          </div>

          {/* Toggle button on desktop */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Main Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-7">
          {/* Main sections */}
          <div className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {isOpen && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}
          </div>

          {/* Recent Chats list section (only when open) */}
          {isOpen && conversations.length > 0 && (
            <div className="space-y-2">
              <div className="px-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Recent Chats
                </span>
              </div>
              <div className="space-y-0.5">
                {conversations.slice(0, 4).map((chat) => (
                  <NavLink
                    key={chat.id}
                    to={`/chat?id=${chat.id}`}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium truncate ${
                      location.search.includes(chat.id)
                        ? 'text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{chat.pdfName}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions & Storage info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/50 space-y-4">
          {/* Storage usage indicator */}
          {isOpen ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold flex items-center">
                  <Database className="h-3.5 w-3.5 mr-1" />
                  Storage Used
                </span>
                <span>{storageUsed} / {maxStorage} MB</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                Upgrade to Pro for 10 GB storage
              </span>
            </div>
          ) : (
            <div className="flex justify-center text-slate-400 hover:text-slate-500">
              <Database className="h-5 w-5" />
            </div>
          )}

          {/* User Settings & Profile */}
          <div className="space-y-1">
            {footerItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {isOpen && <span className="truncate">{item.name}</span>}
              </NavLink>
            ))}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isOpen && <span>Logout</span>}
            </button>
          </div>

          {/* Mini User badge */}
          {user && isOpen && (
            <div className="flex items-center space-x-3 px-1 py-1">
              <Avatar name={user.name} size="sm" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
