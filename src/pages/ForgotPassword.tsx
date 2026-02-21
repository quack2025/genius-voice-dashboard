import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation('auth');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(t('forgotPassword.error'), { description: error.message });
    } else {
      setSent(true);
    }

    setIsLoading(false);
  };

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
            <CardTitle>{t('forgotPassword.title')}</CardTitle>
            <CardDescription>{t('forgotPassword.subtitle')}</CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{t('forgotPassword.success')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('forgotPassword.successMessage')}</p>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/login" className="text-primary hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
