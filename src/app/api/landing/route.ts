import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Public endpoint - no auth required
// Returns landing page content for the public-facing site
export async function GET() {
  try {
    const landingContent = await db.landingContent.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(landingContent);
  } catch (error) {
    console.error('Landing content fetch error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
