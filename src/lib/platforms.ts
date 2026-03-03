export type PlatformStatus = 'available' | 'coming_soon';

export interface PlatformConfig {
  slug: string;
  status: PlatformStatus;
  color: string;
  tier: 1 | 2;
}

export const PLATFORMS: PlatformConfig[] = [
  { slug: 'alchemer', status: 'available', color: '#0066CC', tier: 1 },
  { slug: 'qualtrics', status: 'coming_soon', color: '#B7312C', tier: 2 },
  { slug: 'surveymonkey', status: 'coming_soon', color: '#00BF6F', tier: 2 },
  { slug: 'questionpro', status: 'coming_soon', color: '#0066FF', tier: 2 },
  { slug: 'jotform', status: 'coming_soon', color: '#FF6100', tier: 2 },
  { slug: 'wordpress', status: 'coming_soon', color: '#21759B', tier: 2 },
  { slug: 'typeform', status: 'coming_soon', color: '#262627', tier: 2 },
  { slug: 'formstack', status: 'coming_soon', color: '#21B573', tier: 2 },
  { slug: 'generic', status: 'available', color: '#6366F1', tier: 1 },
];

export const PLATFORM_BY_SLUG = Object.fromEntries(
  PLATFORMS.map((p) => [p.slug, p])
) as Record<string, PlatformConfig>;
