declare namespace App {
  interface Locals {
    seoNoindex?: boolean;
    jobNavigation?: import('./lib/jobboard/metrics').JobNavigation;
  }
}
interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly SITE_INDEXABLE?: string;
  readonly VERCEL_ENV?: string;
  readonly CONTEXT?: string;
}
declare const __RELEASE_COMMIT__: string | null;
declare const __RELEASE_TREE__: string | null;
