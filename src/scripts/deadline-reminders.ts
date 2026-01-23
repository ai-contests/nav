import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createClerkClient } from '@clerk/backend';

const TEMPLATE_PATH = path.join(
  process.cwd(),
  'src/templates/deadline-reminder.html'
);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicontests.dev';

interface Subscription {
  user_id: string;
  contest_id: string;
  reminder_sent_at: string | null;
}

interface ContestData {
  id: string;
  title: string;
  platform: string;
  deadline?: string;
  status: string;
  url: string;
}

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
            url: c.url,
          });
        });
      }
    }
  }
  return contestMap;
}

function isWithin24Hours(deadline: string): boolean {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;
  const hours24 = 24 * 60 * 60 * 1000;
  return diff > 0 && diff <= hours24;
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

async function main() {
  console.log('🔔 Starting Deadline Reminders...');

  // 1. Validate Env Vars
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.CLERK_SECRET_KEY)
    throw new Error('Missing CLERK_SECRET_KEY');

  // 2. Initialize Clients
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const resend = new Resend(process.env.RESEND_API_KEY);
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  // 3. Fetch Subscriptions without reminder_sent_at
  const { data: subscriptions, error } = await supabase
    .from('Subscription')
    .select('*')
    .is('reminder_sent_at', null);

  if (error) {
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('No pending reminders. Exiting.');
    return;
  }

  console.log(`Found ${subscriptions.length} subscriptions without reminders.`);

  // 4. Load Contest Data
  const contestMap = await loadContestMap();

  // 5. Filter to contests ending within 24h
  const urgentSubs: { userId: string; contest: ContestData }[] = [];

  for (const sub of subscriptions as Subscription[]) {
    const contest = contestMap.get(sub.contest_id);
    if (!contest) continue;
    if (contest.status.toLowerCase() !== 'active') continue;
    if (!contest.deadline) continue;
    if (!isWithin24Hours(contest.deadline)) continue;

    urgentSubs.push({ userId: sub.user_id, contest });
  }

  if (urgentSubs.length === 0) {
    console.log('No contests ending within 24h. Exiting.');
    return;
  }

  console.log(`Found ${urgentSubs.length} urgent contest subscriptions.`);

  // 6. Group by User
  const userContests = new Map<string, ContestData[]>();
  for (const { userId, contest } of urgentSubs) {
    const list = userContests.get(userId) || [];
    list.push(contest);
    userContests.set(userId, list);
  }

  // 7. Load Template
  let template = '';
  try {
    template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  } catch (e) {
    console.error('Template file not found at', TEMPLATE_PATH);
    process.exit(1);
  }

  // 8. Process Each User
  for (const [userId, contests] of userContests.entries()) {
    try {
      // Fetch User Email from Clerk
      let email = '';
      try {
        const user = await clerk.users.getUser(userId);
        email =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress ||
          user.emailAddresses[0]?.emailAddress ||
          '';
      } catch (e) {
        console.error(`Failed to fetch user ${userId} from Clerk`, e);
        continue;
      }

      if (!email) {
        console.warn(`No email found for user ${userId}`);
        continue;
      }

      // Render Contest List
      const contestListHtml = contests
        .map(
          (c) => `
            <div class="contest-item">
                <p class="contest-title">${c.platform}: ${c.title}</p>
                <p class="contest-deadline">Ends: ${formatDeadline(c.deadline!)}</p>
                <a href="${SITE_URL}/contests/${c.id}" class="contest-link">View Contest →</a>
            </div>
          `
        )
        .join('');

      const emailHtml = template
        .replace('{{count}}', String(contests.length))
        .replace('{{contestList}}', contestListHtml);

      // Send Email
      const { error: sendError } = await resend.emails.send({
        from: 'AI Contest Navigator <notify@emoai.co.uk>',
        to: email,
        subject: `⚠️ Deadline Alert: ${contests.length} contest(s) ending in 24h`,
        html: emailHtml,
      });

      if (sendError) {
        console.error(`Failed to send email to ${email}`, sendError);
        continue;
      }

      console.log(`✅ Sent reminder to ${email} (${contests.length} contests)`);

      // Update reminder_sent_at for each contest
      for (const contest of contests) {
        const { error: updateError } = await supabase
          .from('Subscription')
          .update({ reminder_sent_at: new Date().toISOString() })
          .match({ user_id: userId, contest_id: contest.id });

        if (updateError) {
          console.error(
            `Failed to update reminder_sent_at for ${userId}/${contest.id}`,
            updateError
          );
        }
      }
    } catch (err) {
      console.error(`Error processing user ${userId}`, err);
    }
  }

  console.log('Done.');
}

main().catch(console.error);
