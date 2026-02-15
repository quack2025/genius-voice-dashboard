import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Copy, Check, Code, Info } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@/i18n';

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedHead, setCopiedHead] = useState(false);

  const generatePublicKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'proj_';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: t('new.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const newPublicKey = generatePublicKey();

    const { error } = await supabase.from('projects').insert({
      user_id: user!.id,
      name: name.trim(),
      public_key: newPublicKey,
      language,
      transcription_mode: 'realtime',
    });

    if (error) {
      toast({
        title: t('new.createError'),
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setPublicKey(newPublicKey);
    setShowSnippetModal(true);
    setIsLoading(false);
  };

  const apiUrl = import.meta.env.VITE_API_URL || 'https://voice-capture-api-production.up.railway.app';

  // Step 1: HEAD script (one-time, loaded via Alchemer Custom HEAD)
  const headSnippet = `<script src="${apiUrl}/voice.js" defer></script>`;

  // Step 2: JS Action snippet (per question, Alchemer 3-step pattern)
  // Positions widget outside <label> to avoid click interception
  const snippet = `(function() {
  var QUESTION_ID = 'q1'; // Change: q1, q2, q3...
  if (document.getElementById('genius-voice-' + QUESTION_ID)) return;
  var c = document.createElement('div');
  c.id = 'genius-voice-' + QUESTION_ID;
  c.setAttribute('data-project', '${publicKey}');
  c.setAttribute('data-question', QUESTION_ID);
  c.setAttribute('data-lang', '${language}');
  var sid = '[survey("session id")]';
  if (sid.indexOf('[') === -1) c.setAttribute('data-session', sid);
  var qs = document.querySelectorAll('.sg-question');
  var q = qs[qs.length - 2];
  if (q) {
    var opts = q.querySelector('.sg-question-options');
    if (opts) q.insertBefore(c, opts);
    else q.appendChild(c);
  }
  if (window.GeniusVoice) GeniusVoice.init(c);
})();`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: tCommon('buttons.copied'),
      description: t('new.snippetCopied'),
    });
  };

  const handleCopyHead = async () => {
    await navigator.clipboard.writeText(headSnippet);
    setCopiedHead(true);
    setTimeout(() => setCopiedHead(false), 2000);
    toast({
      title: tCommon('buttons.copied'),
      description: t('new.snippetCopied'),
    });
  };

  const handleCloseModal = () => {
    setShowSnippetModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('new.backToProjects')}
        </button>
        <h1 className="text-2xl font-bold text-foreground">{t('new.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('new.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('new.cardTitle')}</CardTitle>
          <CardDescription>
            {t('new.cardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('new.name')} *</Label>
              <Input
                id="name"
                placeholder={t('new.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('new.language')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t('new.languagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANGUAGE_NAMES[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('new.creating') : t('new.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Snippet Modal */}
      <Dialog open={showSnippetModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{t('new.created')}</DialogTitle>
                <DialogDescription>
                  {t('new.snippetInstruction')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step 1: HEAD script */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold">{t('new.headSnippetLabel')}</h4>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopyHead}>
                {copiedHead ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{t('new.headSnippetInstruction')}</p>
            <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{headSnippet}</pre>
            </div>
          </div>

          {/* Step 2: JS Action snippet */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold">{t('new.actionSnippetLabel')}</h4>
              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{t('new.actionSnippetInstruction')}</p>
            <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all">{snippet}</pre>
            </div>
          </div>

          {/* Note */}
          <p className="mt-3 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 flex gap-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{t('new.snippetSteps.note')}</span>
          </p>

          <DialogFooter className="mt-4">
            <Button onClick={handleCloseModal}>
              {t('new.goToDashboard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
