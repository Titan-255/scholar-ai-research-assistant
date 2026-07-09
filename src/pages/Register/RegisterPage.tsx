import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, Sparkles, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerContext } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const passwordVal = watch('password', '');

  // Calculate password strength
  useEffect(() => {
    if (!passwordVal) {
      setPasswordStrength({ score: 0, label: 'None', color: 'bg-slate-200' });
      return;
    }

    let score = 0;
    if (passwordVal.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordVal)) score += 1;
    if (/[0-9]/.test(passwordVal)) score += 1;
    if (/[^A-Za-z0-9]/.test(passwordVal)) score += 1;

    let label = 'Weak';
    let color = 'bg-red-500';

    if (score === 2) {
      label = 'Fair';
      color = 'bg-amber-500';
    } else if (score === 3) {
      label = 'Good';
      color = 'bg-indigo-500';
    } else if (score === 4) {
      label = 'Strong';
      color = 'bg-emerald-500';
    }

    setPasswordStrength({ score, label, color });
  }, [passwordVal]);

  const onSubmit = async (data: RegisterSchemaType) => {
    setLoading(true);
    await registerContext(data.name, data.email, data.password, data.confirmPassword);
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 py-12 transition-colors">
      {/* Background visuals */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-indigo-200/40 dark:bg-indigo-950/20 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-200/40 dark:bg-violet-950/20 blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-white">ScholarAI</span>
          </Link>
        </div>

        {/* Card */}
        <Card className="border border-slate-100 dark:border-slate-800/80 shadow-soft-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join ScholarAI to build your research workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <Input
                label="Full Name"
                placeholder="John Doe"
                type="text"
                icon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                disabled={loading}
                {...register('name')}
              />

              <Input
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                disabled={loading}
                {...register('email')}
              />

              <div className="space-y-1.5">
                <Input
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  disabled={loading}
                  {...register('password')}
                />

                {/* Password strength indicators */}
                {passwordVal && (
                  <div className="space-y-1.5 px-0.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wide">
                      <span>Password Strength</span>
                      <span className="text-slate-600 dark:text-slate-350">{passwordStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            i < passwordStrength.score ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                placeholder="••••••••"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                disabled={loading}
                {...register('confirmPassword')}
              />

              {/* Terms checkbox */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 mt-0.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-800"
                    {...register('terms')}
                  />
                  <label
                    htmlFor="terms"
                    className="ml-2 block text-xs text-slate-650 dark:text-slate-400 leading-normal"
                  >
                    I agree to the{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-650 hover:underline font-bold">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-indigo-650 hover:underline font-bold">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.terms && (
                  <span className="text-xs font-semibold text-red-500">
                    {errors.terms.message}
                  </span>
                )}
              </div>

              <Button variant="primary" type="submit" className="w-full mt-2" isLoading={loading}>
                <UserPlus className="h-4 w-4 mr-1.5" />
                Register Account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-650 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
export default RegisterPage;
