import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const landingContent = await db.landingContent.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(landingContent);
  } catch (error) {
    console.error('Landing content fetch error:', error);
    // Return empty array instead of 500 to prevent page crash
    return NextResponse.json([]);
  }
}
