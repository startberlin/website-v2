import type { PageSeo } from './metadata';
import { boardMembers, boardProfileIsIndexable } from '../board-members';

/** Every HTML route must be registered. Indexable static entries feed the sitemap automatically. */
export const pageDefinitions = {
  '/': {
    title: 'Student entrepreneurship in Berlin',
    description: 'START Berlin connects students with the startup ecosystem. Meet our entrepreneurship community, explore our network and find out how to join.',
    canonicalPath: '/',
  },
  '/join': {
    title: 'Join our student entrepreneurship community',
    description: 'Find out how to join START Berlin. Explore membership requirements, departments and the application process for our student entrepreneurship community.',
    canonicalPath: '/join',
  },
  '/members': {
    title: 'Members and departments',
    description: 'Meet the START Berlin board and department members. Browse our student entrepreneurship community by name, role or department.',
    canonicalPath: '/members', pageType: 'CollectionPage',
  },
  '/members/[slug]': {
    title: 'Board member profile',
    description: 'Get to know a START Berlin board member. Explore their selected experience, education and projects, and find their contact links.',
    canonicalPath: null, noindex: true, pageType: 'AboutPage',
  },
  '/jobs': {
    title: 'Startup jobs and internships',
    description: 'Explore open roles from companies in the START Berlin network. Find startup jobs, internships and working student positions, and apply directly with the employer.',
    canonicalPath: '/jobs', pageType: 'CollectionPage',
  },
  '/jobs/submit': {
    title: 'Post a role',
    description: 'Submit an open role to the START Berlin jobboard. Share your company and job details with our team for review before publication.',
    canonicalPath: '/jobs/submit', noindex: true,
  },
  '/jobs/privacy': {
    title: 'Jobboard privacy',
    description: 'Learn how START Berlin handles job listings, employer submissions and application links, and how to contact us about your data.',
    canonicalPath: '/jobs/privacy', noindex: true,
  },
  '/jobs/[id]/[slug]': {
    title: 'Job listing',
    description: 'View a role from the START Berlin network and its application details. Browse the jobboard to find current openings with employers.',
    canonicalPath: null, noindex: true,
  },
  '/legal-notice': {
    title: 'Legal Notice',
    description: 'Legal information for START Berlin e.V., including our registered address, representatives and contact details.',
    canonicalPath: '/legal-notice',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    description: 'Read START Berlin\'s privacy policy, including information about personal data, website services and your data protection rights.',
    canonicalPath: '/privacy-policy',
  },
  '/404': {
    title: 'Page not found',
    description: 'This page could not be found. Return to START Berlin to explore our community, learn how to join or browse current job openings.',
    canonicalPath: null, noindex: true,
  },
} satisfies Record<string, PageSeo>;

export type PageRoute = keyof typeof pageDefinitions;
export function pageSeo(route: PageRoute): PageSeo { return { ...pageDefinitions[route] }; }

export function sitemapPages(): string[] {
  return [
    ...Object.values(pageDefinitions).filter((page) => !('noindex' in page && page.noindex) && page.canonicalPath !== null)
      .map((page) => page.canonicalPath as string),
    ...boardMembers.filter(boardProfileIsIndexable)
      .map((member) => `/members/${member.slug}`),
  ];
}
