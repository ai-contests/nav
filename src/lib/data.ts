import fs from 'fs';
import path from 'path';

// Define strict types for our data
export interface Contest {
  id: string; // Using platform + id as unique key
  title: string;
  url: string;
  platform: string;
  description: string;
  deadline: string; // ISO date string
  prize: string;
  currency?: string;
  tags: string[];
  status: 'Active' | 'Upcoming' | 'Ended';
  image_url?: string;
  difficulty?: number; // 1-10, derived from analysis
  source_id?: string;
}

interface RawContestJSON {
  id?: string;
  competition_id?: string;
  title?: string;
  url: string;
  platform?: string;
  description?: string;
  deadline?: string;
  end_time?: string;
  prize?: string;
  reward?: string;
  tags?: string[];
  status?: string;
  image_url?: string;
  cover_url?: string;
  ai_analysis?: {
    difficulty?: string | number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data', 'processed');

// Helper to get all processed files
function getProcessedFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('-latest.json'));
}

export async function getAllContests(): Promise<Contest[]> {
  const files = getProcessedFiles();
  let allContests: Contest[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(DATA_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data.contests)) {
        const platform = file.split('-')[0]; // Extract platform from filename

        const normalized = data.contests.map((c: RawContestJSON) => ({
          id: `${platform}-${c.id || c.competition_id || Math.random().toString(36).slice(2)}`,
          title: c.title || 'Untitled Contest',
          url: c.url,
          platform: c.platform || platform,
          description: c.description || '',
          deadline: c.deadline || c.end_time || '',
          prize: c.prize || c.reward || 'TBD',
          tags: c.tags || [],
          status: calculateStatus(
            c.status || '',
            c.deadline || c.end_time || ''
          ),
          image_url: c.image_url || c.cover_url || '',
          // Mock difficulty for now if not present, usually AIProcessor adds it
          difficulty: c.ai_analysis?.difficulty
            ? parseDifficulty(c.ai_analysis.difficulty)
            : Math.floor(Math.random() * 5) + 3, // Rand 3-8
        }));

        allContests = [...allContests, ...normalized];
      }
    } catch (e) {
      console.error(`Failed to load data from ${file}`, e);
    }
  }

  // Sort by deadline (Active first, then by date)
  return allContests.sort((a, b) => {
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

export async function getContestById(id: string): Promise<Contest | undefined> {
  const all = await getAllContests();
  return all.find((c) => c.id === id);
}

// Helpers
function calculateStatus(status: string, deadline: string): Contest['status'] {
  if (status && status.toLowerCase().includes('run')) return 'Active';
  if (status && status.toLowerCase().includes('end')) return 'Ended';

  if (!deadline) return 'Active';
  const now = new Date();
  const end = new Date(deadline);
  return end > now ? 'Active' : 'Ended';
}

function parseDifficulty(diff: string | number): number {
  if (typeof diff === 'number') return diff;
  if (diff.toLowerCase().includes('expert')) return 8;
  if (diff.toLowerCase().includes('advanced')) return 7;
  if (diff.toLowerCase().includes('intermediate')) return 5;
  if (diff.toLowerCase().includes('beginner')) return 3;
  return 5;
}
