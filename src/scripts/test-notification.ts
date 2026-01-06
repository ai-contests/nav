
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import { Resend } from 'resend';
import { AppConfig } from '../types';

// Configuration
const CONFIG_PATH = 'config/app.json';
const TEMPLATE_PATH = path.join(process.cwd(), 'src/templates/daily-summary.html');

/**
 * Load App Config
 */
async function loadConfig(): Promise<AppConfig> {
  return await fs.readJson(CONFIG_PATH);
}

/**
 * Mock data for testing
 */
const mockContests = [
  {
    id: 'test-1',
    title: '🏆 AI Challenge: Snake Game RL',
    platform: 'AICrowd',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days later
    status: 'active',
    summary: 'A reinforcement learning challenge to build the smartest snake engine.',
    url: 'https://www.aicrowd.com'
  },
  {
    id: 'test-2',
    title: 'Deep Learning for Medical Imaging',
    platform: 'Kaggle',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days later
    status: 'active',
    summary: 'Identify diseases from X-ray images using advanced CNN architectures.',
    url: 'https://www.kaggle.com'
  }
];

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
  const testEmail = process.argv[2] || process.env.TEST_EMAIL;

  if (!testEmail) {
    console.error('❌ Error: Please provide a test email address.');
    console.log('Usage: npm run test-notify <email>');
    process.exit(1);
  }

  console.log(`🚀 Sending test notification to: ${testEmail}...`);

  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const config = await loadConfig();
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Load Template
  let template = '';
  try {
     template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  } catch (e) {
     console.error('Template file not found at', TEMPLATE_PATH);
     process.exit(1);
  }

  // Render Contest HTML
  const renderContestHtml = (c: { 
    id: string; 
    title: string; 
    platform: string; 
    deadline?: string; 
    status: string; 
    summary?: string; 
    url: string; 
  }) => `
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

  const subscriptionListHtml = mockContests.map(c => renderContestHtml(c)).join('');
  const latestListHtml = mockContests.map(c => renderContestHtml(c)).join(''); // Use same for test

  const emailHtml = template
    .replace('{{date}}', new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    .replace('{{subscriptionList}}', subscriptionListHtml)
    .replace('{{latestList}}', latestListHtml);

  // Send Email
  const { error } = await resend.emails.send({
    from: config.notifications?.fromEmail || 'AI Contest Navigator <notify@emoai.co.uk>',
    to: testEmail,
    subject: `🧪 Test Brief: AI Contest Navigator Template Verification`,
    html: emailHtml,
  });

  if (error) {
    console.error('❌ Failed to send test email:', error);
  } else {
    console.log('✅ Test email sent successfully! Please check your inbox.');
  }
}

main().catch(console.error);
