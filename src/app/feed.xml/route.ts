import { NextResponse } from 'next/server';
import { getAllContests } from '@/lib/data';
import { generateRssFeed, RssItem } from '@/lib/rss';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicontests.dev';
const FEED_TITLE = 'AI Contests Navigator';
const FEED_DESCRIPTION =
  'Latest AI competitions from Kaggle, AICrowd, Devpost, and more';

export async function GET() {
  const contests = await getAllContests();

  // Filter to active/upcoming contests and sort by deadline
  const recentContests = contests
    .filter((c) => c.status === 'Active' || c.status === 'Upcoming')
    .slice(0, 50); // Limit feed size

  const items: RssItem[] = recentContests.map((contest) => ({
    title: `${contest.platform}: ${contest.title}`,
    link: `${SITE_URL}/contests/${contest.id}`,
    description: buildDescription(
      contest.description,
      contest.prize,
      contest.deadline
    ),
    pubDate: new Date(contest.deadline || Date.now()),
    guid: `${SITE_URL}/contests/${contest.id}`,
    categories: contest.tags,
  }));

  const xml = generateRssFeed({
    title: FEED_TITLE,
    link: SITE_URL,
    description: FEED_DESCRIPTION,
    items,
  });

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function buildDescription(
  description: string,
  prize: string,
  deadline: string
): string {
  const parts: string[] = [];

  if (description) {
    // Truncate long descriptions
    const truncated =
      description.length > 200
        ? `${description.slice(0, 197)}...`
        : description;
    parts.push(truncated);
  }

  if (prize && prize !== 'TBD') {
    parts.push(`Prize: ${prize}`);
  }

  if (deadline) {
    const date = new Date(deadline);
    if (!isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      parts.push(`Deadline: ${formatted}`);
    }
  }

  return parts.join('. ');
}
