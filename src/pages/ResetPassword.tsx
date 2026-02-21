import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  useEffect(() => {
    // Give Supabase a moment to process the recovery token from the URL hash
    const timer = setTimeout(() => {
      setHasSession(!!session);
    }, 1000);
    return () => clearTimeout(timer);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Error', { description: t('resetPassword.passwordMismatch') });
      return;
    }

    if (password.length < 6) {
      toast.error('Error', { description: t('resetPassword.passwordTooShort') });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(t('resetPassword.error'), { description: error.message });
    } else {
      setSuccess(true);
      // Sign out so user logs in with new password
      await supabase.auth.signOut();
    }

    setIsLoading(false);
  };

  // Still checking session
  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No valid session — invalid/expired link
  if (!hasSession && !success) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <img src="/genius-labs-logo.webp" alt="Voice Capture" className="h-10 w-auto" />
          </div>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t('resetPassword.invalidLink')}</CardTitle>
              <CardDescription>{t('resetPassword.invalidLinkMessage')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link to="/forgot-password">{t('resetPassword.requestNew')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/genius-labs-logo.webp" alt="Voice Capture" className="h-10 w-auto" />
        </div>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t('resetPassword.title')}</CardTitle>
            <CardDescription>{t('resetPassword.subtitle')}</CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t('resetPassword.success')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('resetPassword.successMessage')}</p>
              </div>
              <Button className="w-full mt-4" asChild>
                <Link to="/login">{t('login.submit')}</Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('resetPassword.newPassword')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('resetPassword.submitting') : t('resetPassword.submit')}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
