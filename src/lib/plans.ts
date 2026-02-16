export interface PlanDefinition {
  name: string;
  price: number;
  max_responses: number;
  max_projects: number | null;
  max_duration: number;
  languages: string[] | null;
  export_formats: string[];
  batch: boolean;
  show_branding: boolean;
  custom_themes: boolean;
  custom_domains: boolean;
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    name: 'Free',
    price: 0,
    max_responses: 100,
    max_projects: 2,
    max_duration: 90,
    languages: ['es'],
    export_formats: ['csv'],
    batch: false,

    show_branding: true,
    custom_themes: false,
    custom_domains: false,
  },
  freelancer: {
    name: 'Freelancer',
    price: 39,
    max_responses: 1000,
    max_projects: 10,
    max_duration: 180,
    languages: ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh'],
    export_formats: ['csv', 'xlsx'],
    batch: true,
    show_branding: false,
    custom_themes: false,
    custom_domains: false,
  },
  pro: {
    name: 'Pro',
    price: 199,
    max_responses: 10000,
    max_projects: null,
    max_duration: 300,
    languages: null,
    export_formats: ['csv', 'xlsx', 'api'],
    batch: true,
    show_branding: false,
    custom_themes: true,
    custom_domains: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    max_responses: 50000,
    max_projects: null,
    max_duration: 600,
    languages: null,
    export_formats: ['csv', 'xlsx', 'api'],
    batch: true,
    show_branding: false,
    custom_themes: true,
    custom_domains: true,
  },
};

export type PlanKey = keyof typeof PLANS;

export function getPlan(key: string): PlanDefinition {
  return PLANS[key] || PLANS.free;
}

export interface UsageData {
  plan: string;
  plan_name: string;
  plan_started_at: string | null;
  limits: {
    max_responses: number;
    max_projects: number | null;
    max_duration: number;
    languages: string[] | null;
    export_formats: string[];
    batch: boolean;
    custom_themes: boolean;
    custom_domains: boolean;
    show_branding: boolean;
  };
  usage: {
    responses_this_month: number;
    projects_count: number;
    per_project: Record<string, number>;
  };
  month: string;
}
