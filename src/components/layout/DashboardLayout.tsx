import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem } from '../ui/Dropdown';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, theme, setTheme } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar Wrapper */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 focus:outline-none"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Title / Breadcrumb Placeholder */}
            <h1 className="text-sm font-semibold text-slate-800 dark:text-white">
              AI Workspace
            </h1>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-indigo-500 rounded-full" />
            </button>

            {/* Profile Menu Dropdown */}
            {user && (
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center space-x-2.5 hover:opacity-90 transition-all focus:outline-none">
                    <Avatar name={user.name} size="sm" />
                    <span className="hidden sm:inline-flex text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {user.name}
                    </span>
                  </button>
                }
              >
                <div className="px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/50">
                  <p className="text-xs font-semibold text-slate-850 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <DropdownItem onClick={() => navigate('/profile')}>
                  <User className="h-3.5 w-3.5" />
                  <span>My Profile</span>
                </DropdownItem>
                <DropdownItem onClick={() => navigate('/settings')}>
                  <Settings className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </DropdownItem>
                <DropdownItem onClick={handleLogout} danger>
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownItem>
              </Dropdown>
            )}
          </div>
        </header>

        {/* Dynamic page contents nested inside */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
