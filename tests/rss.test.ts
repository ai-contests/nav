import { generateRssFeed, RssFeedOptions } from '../src/lib/rss';

describe('generateRssFeed', () => {
  it('generates valid RSS 2.0 XML with channel metadata', () => {
    const options: RssFeedOptions = {
      title: 'Test Feed',
      link: 'https://example.com',
      description: 'A test feed',
      items: [],
    };

    const xml = generateRssFeed(options);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain('<title>Test Feed</title>');
    expect(xml).toContain('<link>https://example.com</link>');
    expect(xml).toContain('<description>A test feed</description>');
    expect(xml).toContain('</channel>');
    expect(xml).toContain('</rss>');
  });

  it('generates items with all required fields', () => {
    const options: RssFeedOptions = {
      title: 'Test Feed',
      link: 'https://example.com',
      description: 'A test feed',
      items: [
        {
          title: 'Kaggle: Housing Prices',
          link: 'https://example.com/contests/kaggle-housing',
          description:
            'Predict housing prices. Prize: $10,000. Deadline: Feb 15, 2026.',
          pubDate: new Date('2026-01-20T12:00:00Z'),
          guid: 'https://example.com/contests/kaggle-housing',
          categories: ['Machine Learning', 'Tabular'],
        },
      ],
    };

    const xml = generateRssFeed(options);

    expect(xml).toContain('<title>Kaggle: Housing Prices</title>');
    expect(xml).toContain(
      '<link>https://example.com/contests/kaggle-housing</link>'
    );
    expect(xml).toContain(
      '<description>Predict housing prices. Prize: $10,000. Deadline: Feb 15, 2026.</description>'
    );
    expect(xml).toContain(
      '<guid isPermaLink="true">https://example.com/contests/kaggle-housing</guid>'
    );
    expect(xml).toContain('<category>Machine Learning</category>');
    expect(xml).toContain('<category>Tabular</category>');
    expect(xml).toContain('<pubDate>');
  });

  it('escapes XML special characters in content', () => {
    const options: RssFeedOptions = {
      title: 'Test & Feed',
      link: 'https://example.com',
      description: 'A <test> feed',
      items: [
        {
          title: 'Contest with "quotes" & <brackets>',
          link: 'https://example.com/test',
          description: 'Description with & and <tags>',
          pubDate: new Date('2026-01-20T12:00:00Z'),
          guid: 'https://example.com/test',
          categories: [],
        },
      ],
    };

    const xml = generateRssFeed(options);

    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).toContain('&gt;');
    expect(xml).not.toContain('<test>');
    expect(xml).not.toContain('<brackets>');
  });
});
