export type PlatformStatus = 'available' | 'coming_soon';

export interface PlatformConfig {
  slug: string;
  status: PlatformStatus;
  color: string;
  tier: 1 | 2;
}

export const PLATFORMS: PlatformConfig[] = [
  { slug: 'alchemer', status: 'available', color: '#0066CC', tier: 1 },
  { slug: 'qualtrics', status: 'available', color: '#B7312C', tier: 1 },
  { slug: 'surveymonkey', status: 'available', color: '#00BF6F', tier: 1 },
  { slug: 'questionpro', status: 'available', color: '#0066FF', tier: 1 },
  { slug: 'jotform', status: 'available', color: '#FF6100', tier: 1 },
  { slug: 'wordpress', status: 'coming_soon', color: '#21759B', tier: 2 },
  { slug: 'typeform', status: 'coming_soon', color: '#262627', tier: 2 },
  { slug: 'formstack', status: 'coming_soon', color: '#21B573', tier: 2 },
  { slug: 'generic', status: 'available', color: '#6366F1', tier: 1 },
];

export const PLATFORM_BY_SLUG = Object.fromEntries(
  PLATFORMS.map((p) => [p.slug, p])
) as Record<string, PlatformConfig>;
