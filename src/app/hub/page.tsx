import { getAllContests } from '@/lib/data';
import { HubClient } from './client';

// Server Component
export default async function HubPage() {
  const initialContests = await getAllContests();

  return (
    <div className="min-h-screen bg-canvas font-mono flex flex-col">
      <HubClient initialContests={initialContests} />
    </div>
  );
}
