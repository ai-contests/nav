import { getAllContests, getContestById } from '@/lib/data';
import { ContestDetailClient } from './client';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
    params: {
        id: string;
    }
}

// Generate static pages for all contests at build time
export async function generateStaticParams() {
    const contests = await getAllContests();
    return contests.map((contest) => ({
        id: contest.id,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const contest = await getContestById(params.id);
    if (!contest) return { title: 'Not Found' };
    
    return {
        title: `${contest.title} | AI_NAV_`,
        description: contest.description.slice(0, 160),
    };
}

export default async function ContestDetailPage({ params }: PageProps) {
    const contest = await getContestById(params.id);

    if (!contest) {
        notFound();
    }

    return <ContestDetailClient contest={contest} />;
}
