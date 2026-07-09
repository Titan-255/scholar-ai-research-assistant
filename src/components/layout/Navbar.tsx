import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-650 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
            ScholarAI
          </span>
        </Link>

        {/* Mid Navigation links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            How it Works
          </a>
          <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Pricing
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden sm:inline-flex">
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                <UserPlus className="h-4 w-4 mr-1.5" />
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
