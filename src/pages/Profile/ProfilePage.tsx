import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Calendar, Edit, Check, FileText, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
});

type ProfileSchemaType = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, pdfs, conversations } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSchemaType>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = (data: ProfileSchemaType) => {
    setLoading(true);
    setTimeout(() => {
      updateProfile(data.name, data.email);
      setLoading(false);
      setIsEditing(false);
    }, 800);
  };

  const storageUsed = user?.storageUsed || 0;
  const maxStorage = user?.maxStorage || 100;
  const storagePercentage = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

  const completedCount = pdfs.filter(p => ['Ready', 'Indexed', 'Completed'].includes(p.status)).length;
  const processingCount = pdfs.filter(p => !['Ready', 'Indexed', 'Completed', 'Failed'].includes(p.status)).length;
  const failedCount = pdfs.filter(p => p.status === 'Failed').length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            User Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal data credentials and workspace usage statistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Overview */}
          <div className="space-y-6 md:col-span-1">
            <Card className="text-center">
              <CardContent className="pt-6 flex flex-col items-center space-y-4">
                <Avatar name={user?.name || 'User'} size="xl" />
                <div className="space-y-1.5">
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">{user?.name}</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{user?.email}</p>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider py-1 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full">
                  <Calendar className="h-3.5 w-3.5 mr-0.5 text-indigo-500" />
                  <span>Joined {user?.joinedDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats counts card */}
            <Card>
              <CardContent className="py-4 space-y-3 text-xs font-semibold text-slate-650 dark:text-slate-300">
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center text-slate-400 font-normal">
                    <FileText className="h-4 w-4 mr-2" />
                    Total PDFs
                  </span>
                  <span>{pdfs.length} files</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/50 pt-3">
                  <span className="flex items-center text-slate-400 font-normal">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat History
                  </span>
                  <span>{conversations.length} threads</span>
                </div>
                <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/50 pt-3">
                  <span className="flex items-center text-slate-400 font-normal">
                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                    Indexed Vaultees
                  </span>
                  <span>{completedCount} ready</span>
                </div>
                {processingCount > 0 && (
                  <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/50 pt-3">
                    <span className="flex items-center text-slate-400 font-normal">
                      <Clock className="h-4 w-4 mr-2 text-amber-500 animate-spin" />
                      Processing Pipeline
                    </span>
                    <span>{processingCount} processing</span>
                  </div>
                )}
                {failedCount > 0 && (
                  <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/50 pt-3">
                    <span className="flex items-center text-slate-400 font-normal">
                      <AlertCircle className="h-4 w-4 mr-2 text-rose-500" />
                      Failed Ingestions
                    </span>
                    <span>{failedCount} failed</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Profile & Storage details */}
          <div className="space-y-6 md:col-span-2">
            {/* Account Details Form */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Account Details
                  </CardTitle>
                  <CardDescription>
                    Update names and emails registered to this local workspace.
                  </CardDescription>
                </div>

                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit Profile
                  </Button>
                )}
              </CardHeader>

              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                    <Input
                      label="Full Name"
                      type="text"
                      icon={<User className="h-4 w-4" />}
                      error={errors.name?.message}
                      disabled={loading}
                      {...register('name')}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email?.message}
                      disabled={loading}
                      {...register('email')}
                    />

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50 dark:border-slate-805/50 mt-4">
                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        size="sm"
                        isLoading={loading}
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50 dark:border-slate-850/50">
                      <span className="text-slate-400">Full Name</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{user?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-50 dark:border-slate-850/50">
                      <span className="text-slate-400">Email Address</span>
                      <span className="font-semibold text-slate-850 dark:text-white truncate">{user?.email}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2">
                      <span className="text-slate-400">Access Role</span>
                      <span className="font-semibold text-indigo-650">Workspace Owner</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Storage occupancy Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Storage Allocation details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-650 dark:text-slate-350">Workspace Filesize Capacity</span>
                  <span className="text-indigo-650">{storagePercentage}% occupied</span>
                </div>

                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{storageUsed} MB occupied</span>
                  <span>{maxStorage} MB limit</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default ProfilePage;
