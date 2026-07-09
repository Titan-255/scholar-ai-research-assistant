import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Globe,
  Trash2,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, language, setLanguage, logout, addToast, storageProvider } = useApp();
  const navigate = useNavigate();

  // Settings states
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    indexStatus: true,
    securityLogs: false,
  });

  // Modal control
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    addToast('success', 'Notification preferences updated');
  };

  const handleDeleteAccount = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsDeleteModalOpen(false);
      logout();
      navigate('/');
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Workspace Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure system themes, notifications, and profile details.
          </p>
        </div>

        {/* 1. Theme Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Appearance & Aesthetics
            </CardTitle>
            <CardDescription>
              Toggle between light mode, dark mode, or system default interfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-600">
                  {theme === 'light' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <span className="font-semibold text-xs text-slate-800 dark:text-white block">
                    Active Theme Mode
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Currently set to {theme === 'light' ? 'Light' : 'Dark'} mode
                  </span>
                </div>
              </div>

              <div className="flex bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Language Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Localization
            </CardTitle>
            <CardDescription>
              Set active language options for UI labels and notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-violet-50 dark:bg-violet-950/40 p-2 rounded-lg text-violet-650">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-slate-800 dark:text-white block">
                    System Language
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Default parsing language for the application
                  </span>
                </div>
              </div>

              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  addToast('success', `Language changed to ${e.target.value}`);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:border-indigo-500 focus:outline-none"
              >
                <option value="English">English (US)</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 2.5. Cloud Storage Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Cloud Storage System
            </CardTitle>
            <CardDescription>
              Verify the active document storage provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-650">
                  <Database className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-slate-800 dark:text-white block">
                    Storage Provider
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Currently configured data catalog driver
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-550/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {storageProvider === 'S3' ? 'AWS S3' : 'LOCAL FILESYSTEM'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Notification Cues
            </CardTitle>
            <CardDescription>
              Configure triggers that fire toasts or local notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Email notifications */}
            <div className="flex items-center justify-between py-3.5">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-850 dark:text-white block">
                  Email summary alerts
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-400">
                  Weekly summary logs of files uploaded
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailAlerts}
                onChange={() => handleToggleNotification('emailAlerts')}
                className="h-4.5 w-9 rounded-full bg-slate-200 dark:bg-slate-800 appearance-none relative p-0.5 cursor-pointer checked:bg-indigo-650 transition-colors after:content-[''] after:h-3.5 after:w-3.5 after:bg-white after:rounded-full after:block after:shadow-sm after:transition-transform checked:after:translate-x-4"
              />
            </div>

            {/* Indexing alerts */}
            <div className="flex items-center justify-between py-3.5">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-850 dark:text-white block">
                  PDF Index updates
                </span>
                <span className="text-[10px] text-slate-450 dark:text-slate-400">
                  Trigger notifications when a file completes Processing to Indexed cycle
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.indexStatus}
                onChange={() => handleToggleNotification('indexStatus')}
                className="h-4.5 w-9 rounded-full bg-slate-200 dark:bg-slate-800 appearance-none relative p-0.5 cursor-pointer checked:bg-indigo-650 transition-colors after:content-[''] after:h-3.5 after:w-3.5 after:bg-white after:rounded-full after:block after:shadow-sm after:transition-transform checked:after:translate-x-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Danger Zone */}
        <Card className="border-red-100 dark:border-red-950/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-500">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible account deletions and resource wipes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-red-50/20 dark:bg-red-950/10 border border-red-100/40 dark:border-red-900/10 rounded-xl">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-slate-850 dark:text-white block">
                  Delete Workspace & Account
                </span>
                <span className="text-[10px] text-slate-400">
                  Remove all PDFs, chat histories, and profile states forever.
                </span>
              </div>
              <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete modal confirm */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Are you absolutely sure you want to delete your ScholarAI account? This will immediately wipe your PDF database files and conversation logs. <strong>This action cannot be undone.</strong>
          </p>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              isLoading={loading}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
export default SettingsPage;
