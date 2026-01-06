
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';
import { AppConfig } from '../types';

// Configuration
const CONFIG_PATH = 'config/app.json';
const TEMPLATE_PATH = path.join(process.cwd(), 'src/templates/daily-summary.html');

// Interfaces
interface Subscription {
  user_id: string;
  contest_id: string;
}

interface ContestData {
  id: string;
  title: string;
  platform: string;
  deadline?: string;
  status: string;
  summary?: string;
  url: string;
  scrapedAt: string;
}

/**
 * Load App Config
 */
async function loadConfig(): Promise<AppConfig> {
  return await fs.readJson(CONFIG_PATH);
}

/**
 * Load all processed contests into a Map for quick lookup
 */
async function loadContestMap(): Promise<Map<string, ContestData>> {
  const dataDir = path.join(process.cwd(), 'data', 'processed');
  const files = await fs.readdir(dataDir);
  const contestMap = new Map<string, ContestData>();

  for (const file of files) {
    if (file.endsWith('-latest.json')) {
      const content = await fs.readJson(path.join(dataDir, file));
      if (Array.isArray(content.contests)) {
        content.contests.forEach((c: ContestData) => {
          contestMap.set(c.id, {
            id: c.id,
            title: c.title,
            platform: c.platform,
            deadline: c.deadline,
            status: c.status,
            summary: c.summary,
            url: c.url,
            scrapedAt: c.scrapedAt || new Date().toISOString()
          });
        });
      }
    }
  }
  return contestMap;
}

/**
 * Calculate time remaining
 */
function getTimeRemaining(deadline?: string): string {
  if (!deadline) return 'TBD';
  const end = new Date(deadline).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Daily Subscription Notification...');

  // 1. Validate Env Vars
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.CLERK_SECRET_KEY) throw new Error('Missing CLERK_SECRET_KEY');

  const config = await loadConfig();

  // 2. Initialize Clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const resend = new Resend(process.env.RESEND_API_KEY);
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  // 3. Fetch Subscriptions
  const { data: subscriptions, error } = await supabase
    .from('Subscription')
    .select('*');

  if (error || !subscriptions) {
    throw new Error(`Failed to fetch subscriptions: ${error?.message}`);
  }
  
  if (subscriptions.length === 0) {
    console.log('No subscriptions found. Exiting.');
    return;
  }

  // 4. Group by User
  const userSubs = new Map<string, string[]>(); // userId -> contestIds[]
  subscriptions.forEach((sub: Subscription) => {
    const list = userSubs.get(sub.user_id) || [];
    list.push(sub.contest_id);
    userSubs.set(sub.user_id, list);
  });

  console.log(`Found ${userSubs.size} subscribers.`);

  // 5. Load Contest Data
  const contestMap = await loadContestMap();
  const allContests = Array.from(contestMap.values());

  // 6. Identify Latest Contests (Top 5 newly scraped, not ended)
  const latestContests = allContests
    .filter(c => c.status.toLowerCase() === 'active')
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());

  // 7. Load Template
  let template = '';
  try {
     template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  } catch (e) {
     console.error('Template file not found at', TEMPLATE_PATH);
     process.exit(1);
  }

  // 8. Helper to Render Contest HTML
  const renderContestHtml = (c: ContestData) => `
    <div class="contest-card">
        <a href="${c.url}" class="contest-title" target="_blank">${c.title}</a>
        <div class="meta">
            <span class="badge">${c.platform}</span>
            <span class="countdown">⏳ ${getTimeRemaining(c.deadline)} left</span>
            ${c.deadline ? `<span style="font-size: 13px; color: #6b7280;">(Due: ${new Date(c.deadline).toLocaleDateString()})</span>` : ''}
        </div>
        <div class="summary">
            ${c.summary || 'No summary available.'}
        </div>
    </div>
  `;

  // 9. Process Each User
  for (const [userId, contestIds] of userSubs.entries()) {
    try {
      // Fetch User Email from Clerk
      let email = '';
      try {
        const user = await clerk.users.getUser(userId);
        email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress || '';
      } catch (e) {
        console.error(`Failed to fetch user ${userId} from Clerk`, e);
        continue;
      }

      if (!email) {
        console.warn(`No email found for user ${userId}`);
        continue;
      }

      // Filter and Sort Subscribed Contests
      const userContests = contestIds
        .map(id => contestMap.get(id))
        .filter(c => c !== undefined && c.status.toLowerCase() === 'active')
        .sort((a, b) => {
            if (!a?.deadline) return 1;
            if (!b?.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        })
        .slice(0, 5); // Strictly Limit to 5

      // Prepare Latest Contests (Limit to 5)
      // Exclude ones the user is already subscribed to for "Discovery"
      const subIds = new Set(contestIds);
      const discoveries = latestContests
        .filter(c => !subIds.has(c.id))
        .slice(0, 5);

      if (userContests.length === 0 && discoveries.length === 0) continue;

      // Replace Placeholders
      const emailHtml = template
        .replace('{{date}}', new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
        .replace('{{subscriptionList}}', userContests.length > 0 ? userContests.map(c => renderContestHtml(c as ContestData)).join('') : '<p style="color: #666; font-size: 14px;">No active subscriptions. Try exploring new challenges below!</p>')
        .replace('{{latestList}}', discoveries.length > 0 ? discoveries.map(c => renderContestHtml(c)).join('') : '<p style="color: #666; font-size: 14px;">No new contests discovered today. Check back tomorrow!</p>');

      // Send Email
      const { error: sendError } = await resend.emails.send({
        from: config.notifications?.fromEmail || 'AI Contest Navigator <notify@emoai.co.uk>',
        to: email,
        subject: `📅 Daily Brief: ${userContests.length} Subscriptions & ${discoveries.length} New Challenges`,
        html: emailHtml,
      });

      if (sendError) {
        console.error(`Failed to send email to ${email}`, sendError);
      } else {
        console.log(`✅ Sent summary to ${email} (${userContests.length} subs, ${discoveries.length} new)`);
      }

    } catch (err) {
      console.error(`Error processing user ${userId}`, err);
    }
  }

  console.log('Done.');
}

main().catch(console.error);
