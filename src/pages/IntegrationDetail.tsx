import { useTranslation } from 'react-i18next';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_BY_SLUG } from '@/lib/platforms';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Headphones, ArrowLeft, ArrowRight, Copy, Check, MessageCircle, Clock } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation('integrations');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between rounded-t-lg bg-muted px-4 py-2 border border-b-0 border-border">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              {t('common.codeCopied')}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              {t('common.copyCode')}
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-b-lg border border-border bg-zinc-950 p-4 text-sm text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ComingSoonPage({ slug }: { slug: string }) {
  const { t } = useTranslation('integrations');
  const platform = PLATFORM_BY_SLUG[slug];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Link
            to="/integrations"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-3 w-3" />
            {t('common.backToIntegrations')}
          </Link>
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl text-white font-bold text-xl"
            style={{ backgroundColor: platform.color }}
          >
            {t(`platforms.${slug}.name`).substring(0, 2).toUpperCase()}
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {t(`platforms.${slug}.hero.title`)}
            <span className="text-primary">{t(`platforms.${slug}.hero.titleHighlight`)}</span>
          </h1>
          <Badge variant="secondary" className="mt-4 text-sm">
            <Clock className="mr-1 h-3 w-3" />
            {t('common.comingSoonBadge')}
          </Badge>
          <p className="mt-6 text-lg text-muted-foreground">
            {t(`platforms.${slug}.comingSoonMessage`)}
          </p>
          <Button size="lg" className="mt-10" asChild>
            <Link to="/integrations">
              {t('common.backToIntegrations')}
            </Link>
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Nav() {
  const { t } = useTranslation('integrations');
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Voice Capture</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('hub.title')}
          </Link>
          <Link to="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.pricing', { ns: 'landing' })}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">{t('nav.login', { ns: 'landing' })}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">{t('nav.signup', { ns: 'landing' })}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6">
        &copy; {new Date().getFullYear()} Voice Capture. All rights reserved.
      </div>
    </footer>
  );
}

export default function IntegrationDetail() {
  const { platform: slug } = useParams<{ platform: string }>();
  const { t } = useTranslation('integrations');

  if (!slug || !PLATFORM_BY_SLUG[slug]) {
    return <Navigate to="/integrations" replace />;
  }

  const platform = PLATFORM_BY_SLUG[slug];

  if (platform.status === 'coming_soon') {
    return <ComingSoonPage slug={slug} />;
  }

  // Get steps array from i18n — use returnObjects for array
  const steps = t(`platforms.${slug}.setup.steps`, { returnObjects: true }) as Array<{
    title: string;
    description: string;
    code: string;
  }>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Link
            to="/integrations"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            {t('common.backToIntegrations')}
          </Link>
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl text-white font-bold text-xl"
            style={{ backgroundColor: platform.color }}
          >
            {t(`platforms.${slug}.name`).substring(0, 2).toUpperCase()}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t(`platforms.${slug}.hero.title`)}
            <span className="text-primary">{t(`platforms.${slug}.hero.titleHighlight`)}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t(`platforms.${slug}.hero.subtitle`)}
          </p>
          <Badge className="mt-4">{t('common.availableBadge')}</Badge>
        </div>
      </section>

      {/* Setup Steps */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-8">{t(`platforms.${slug}.setup.title`)}</h2>
          <div className="space-y-6">
            {Array.isArray(steps) &&
              steps.map((step, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {step.code && (
                    <CardContent className="pt-0 pl-16">
                      <CodeBlock code={step.code} label={t('common.step', { number: i + 1 })} />
                    </CardContent>
                  )}
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Merge Code / Session ID */}
      <section className="border-t border-border py-12 sm:py-16 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h3 className="text-xl font-bold mb-4">{t('common.sessionIdNote')}</h3>
          <Card>
            <CardContent className="pt-6">
              <code className="rounded bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100">
                {t(`platforms.${slug}.mergeCode.sessionId`)}
              </code>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(`platforms.${slug}.mergeCode.description`)}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Need Help */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-center text-center py-8 sm:flex-row sm:text-left sm:gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 mb-4 sm:mb-0">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{t('common.needHelp')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t('common.needHelpDesc')}</p>
              </div>
              <Button variant="outline" asChild className="mt-4 sm:mt-0">
                <Link to="/register">{t('common.openChat')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t('cta.title', { ns: 'landing' })}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t('cta.subtitle', { ns: 'landing' })}
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/register">
              {t('common.getStarted')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
