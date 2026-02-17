import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({
        title: 'Error',
        description: t('resetPassword.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: t('resetPassword.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: t('resetPassword.error'),
        description: error.message,
        variant: 'destructive',
      });
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
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No valid session — invalid/expired link
  if (!hasSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar p-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <Mic className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Voice Capture</span>
            </div>
            <CardTitle className="text-xl">{t('resetPassword.invalidLink')}</CardTitle>
            <CardDescription>{t('resetPassword.invalidLinkMessage')}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" asChild>
              <Link to="/forgot-password">{t('resetPassword.requestNew')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Mic className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Voice Capture</span>
          </div>
          <CardTitle className="text-xl">{t('resetPassword.title')}</CardTitle>
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
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('resetPassword.submitting') : t('resetPassword.submit')}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
