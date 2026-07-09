import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Sparkles, ArrowRight, Github } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const loginSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional(),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    // Simulating context auth trigger
    await login(data.email, data.password);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 py-12 transition-colors">
      {/* Background visual element */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-200/40 dark:bg-indigo-950/20 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-200/40 dark:bg-violet-950/20 blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-6">
        {/* Top Back Home Nav */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-white">ScholarAI</span>
          </Link>
        </div>

        {/* Card wrapper */}
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-soft-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Enter credentials to access your research space.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <Input
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                disabled={loading}
                {...register('email')}
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-405 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  placeholder="••••••••"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  disabled={loading}
                  {...register('password')}
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800"
                  {...register('rememberMe')}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Remember this device
                </label>
              </div>

              <Button variant="primary" type="submit" className="w-full mt-2" isLoading={loading}>
                Sign In
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800/80" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold uppercase tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    login('google.user@example.com', 'Google User');
                    setLoading(false);
                    navigate('/dashboard');
                  }, 800);
                }}
                className="w-full text-xs"
                disabled={loading}
              >
                {/* Google Icon */}
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    login('github.user@example.com', 'GitHub User');
                    setLoading(false);
                    navigate('/dashboard');
                  }, 800);
                }}
                className="w-full text-xs"
                disabled={loading}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-xs text-slate-500">
              New to ScholarAI?{' '}
              <Link to="/register" className="font-bold text-indigo-650 hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
export default LoginPage;
