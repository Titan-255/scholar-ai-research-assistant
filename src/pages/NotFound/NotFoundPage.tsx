import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 py-12 transition-colors">
      <div className="text-center space-y-6 max-w-md">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-100 dark:border-indigo-900/50">
          <FileQuestion className="h-10 w-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            404
          </h1>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Citation Lost in Index
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-xs mx-auto">
            The page or document pointer you are looking for has either been deleted, renamed, or never indexed by ScholarAI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Go Back
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/')} className="w-full sm:w-auto">
            <Home className="h-4 w-4 mr-1.5" />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};
export default NotFoundPage;
