import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { contestId } = await req.json();
    if (!contestId) {
      return new NextResponse('Contest ID required', { status: 400 });
    }

    const { data, error } = await supabase
      .from('Subscription')
      .insert({ user_id: userId, contest_id: contestId })
      .select();

    if (error) {
      // Check for duplicate key error (already subscribed)
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'Already subscribed' },
          { status: 200 }
        );
      }
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { contestId } = await req.json();

    const { error } = await supabase
      .from('Subscription')
      .delete()
      .match({ user_id: userId, contest_id: contestId });

    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function GET(_req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      // Return empty list for unauthenticated users
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from('Subscription')
      .select('contest_id')
      .eq('user_id', userId);

    if (error) {
      return new NextResponse(error.message, { status: 500 });
    }

    // Return array of contest IDs
    return NextResponse.json(
      data.map((item: { contest_id: string }) => item.contest_id)
    );
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
