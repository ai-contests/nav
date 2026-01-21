export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  guid: string;
  categories: string[];
}

export interface RssFeedOptions {
  title: string;
  link: string;
  description: string;
  items: RssItem[];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRssDate(date: Date): string {
  return date.toUTCString();
}

export function generateRssFeed(options: RssFeedOptions): string {
  const { title, link, description, items } = options;

  const itemsXml = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${formatRssDate(item.pubDate)}</pubDate>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      ${item.categories.map((cat) => `<category>${escapeXml(cat)}</category>`).join('\n      ')}
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(description)}</description>
    <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>
    <language>en-us</language>${itemsXml}
  </channel>
</rss>`;
}
