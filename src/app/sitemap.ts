import { MetadataRoute } from 'next';
import { getAllContests } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nav.ai-contests.com'; // TODO: Update with actual domain if different

  // Static routes
  const staticRoutes = ['', '/hub', '/logs', '/signals'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic contest routes
  const contests = await getAllContests();
  const contestRoutes = contests.map((contest) => ({
    url: `${baseUrl}/contest/${contest.id}`,
    lastModified: contest.deadline ? new Date(contest.deadline) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...contestRoutes];
}
