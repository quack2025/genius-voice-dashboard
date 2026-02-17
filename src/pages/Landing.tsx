import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PLANS } from '@/lib/plans';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  Mic,
  Globe,
  Code,
  Download,
  Brain,
  Shield,
  Check,
  ArrowRight,
  Headphones,
} from 'lucide-react';

const featureIcons = [Mic, Globe, Code, Download, Brain, Shield];
const featureKeys = ['realtime', 'multilingual', 'integration', 'export', 'analytics', 'security'] as const;

const planKeys = ['free', 'freelancer', 'pro', 'enterprise'] as const;

export default function Landing() {
  const { t } = useTranslation('landing');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Voice Capture</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.pricing')}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">{t('nav.signup')}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t('hero.title')}{' '}
            <span className="text-primary">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link to="/register">
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">{t('hero.ctaSecondary')}</a>
            </Button>
          </div>
          <p className="mt-10 text-xs text-muted-foreground">{t('hero.trustedBy')}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t('features.sectionTitle')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t('features.sectionSubtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <Card key={key} className="border-border bg-card transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t(`features.${key}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{t(`features.${key}.description`)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">{t('pricing.sectionTitle')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t('pricing.sectionSubtitle')}</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {planKeys.map((key) => {
              const plan = PLANS[key];
              const isPopular = key === 'pro';
              return (
                <Card
                  key={key}
                  className={`relative flex flex-col border-border bg-card ${isPopular ? 'ring-2 ring-primary' : ''}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      {t('pricing.popular')}
                    </Badge>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? t('pricing.cta.free').split(' ')[0] : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-muted-foreground">{t('pricing.monthly')}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="flex-1 space-y-2 text-sm">
                      <PricingFeature>
                        {String(t('pricing.features.responses', { count: plan.max_responses.toLocaleString() } as any))}
                      </PricingFeature>
                      <PricingFeature>
                        {plan.max_projects
                          ? String(t('pricing.features.projects', { count: plan.max_projects } as any))
                          : String(t('pricing.features.projectsUnlimited'))}
                      </PricingFeature>
                      <PricingFeature>
                        {String(t('pricing.features.duration', { count: plan.max_duration } as any))}
                      </PricingFeature>
                      <PricingFeature>
                        {plan.languages
                          ? String(t('pricing.features.languages', { count: plan.languages.length } as any))
                          : String(t('pricing.features.allLanguages'))}
                      </PricingFeature>
                      {plan.batch && <PricingFeature>{t('pricing.features.batch')}</PricingFeature>}
                      {!plan.show_branding && <PricingFeature>{t('pricing.features.noBranding')}</PricingFeature>}
                      {plan.custom_themes && <PricingFeature>{t('pricing.features.customThemes')}</PricingFeature>}
                      {plan.custom_domains && <PricingFeature>{t('pricing.features.customDomains')}</PricingFeature>}
                      {plan.export_formats.includes('api') && (
                        <PricingFeature>{t('pricing.features.apiAccess')}</PricingFeature>
                      )}
                    </ul>
                    <Button
                      className="mt-6 w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to="/register">
                        {key === 'enterprise'
                          ? t('pricing.cta.enterprise')
                          : key === 'free'
                            ? t('pricing.cta.free')
                            : t('pricing.cta.paid')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">{t('cta.title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('cta.subtitle')}</p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/register">
              {t('cta.button')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Voice Capture. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
