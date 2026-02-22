import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLATFORMS, type PlatformConfig } from '@/lib/platforms';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Headphones, ArrowRight, ArrowLeft } from 'lucide-react';

const supported = PLATFORMS.filter((p) => p.status === 'available');
const comingSoon = PLATFORMS.filter((p) => p.status === 'coming_soon');

function PlatformCard({ platform }: { platform: PlatformConfig }) {
  const { t } = useTranslation('integrations');
  const isAvailable = platform.status === 'available';

  const card = (
    <Card
      className={`flex flex-col border-border bg-card transition-shadow ${
        isAvailable ? 'hover:shadow-md cursor-pointer' : 'opacity-60'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm"
            style={{ backgroundColor: platform.color }}
          >
            {t(`platforms.${platform.slug}.name`).substring(0, 2).toUpperCase()}
          </div>
          <Badge variant={isAvailable ? 'default' : 'secondary'} className="text-xs">
            {isAvailable ? t('common.availableBadge') : t('common.comingSoonBadge')}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-2">
          {t(`platforms.${platform.slug}.name`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-sm text-muted-foreground flex-1">
          {t(`platforms.${platform.slug}.tagline`)}
        </p>
        {isAvailable && (
          <div className="mt-4 flex items-center text-sm font-medium text-primary">
            {t('hub.viewGuide')}
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isAvailable) {
    return <Link to={`/integrations/${platform.slug}`}>{card}</Link>;
  }
  return card;
}

export default function Integrations() {
  const { t } = useTranslation('integrations');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Voice Capture</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features', { ns: 'landing' })}
            </Link>
            <span className="text-sm font-medium text-foreground">
              {t('hub.title')}
            </span>
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

      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3 w-3" />
            Voice Capture
          </Link>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {t('hub.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t('hub.subtitle')}
          </p>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-8">{t('hub.supported')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {supported.map((platform) => (
              <PlatformCard key={platform.slug} platform={platform} />
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      {comingSoon.length > 0 && (
        <section className="py-12 sm:py-16 border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold mb-8">{t('hub.comingSoon')}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((platform) => (
                <PlatformCard key={platform.slug} platform={platform} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border py-16 sm:py-20">
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          &copy; {new Date().getFullYear()} Voice Capture. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
