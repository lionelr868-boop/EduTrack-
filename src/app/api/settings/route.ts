import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
    }

    return NextResponse.json(institution);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      institutionId,
      name,
      address,
      phone,
      email,
      website,
      city,
      wilaya,
      logo,
      directorName,
      academicYear,
      workingDays,
      sessionDuration,
      startTime,
      endTime,
      enableSMS,
      enableEmail,
      absenceTemplate,
      invoiceTemplate,
      reminderTemplate,
    } = body;

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (city !== undefined) updateData.city = city;
    if (wilaya !== undefined) updateData.wilaya = wilaya;
    if (logo !== undefined) updateData.logo = logo;
    if (directorName !== undefined) updateData.directorName = directorName;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (workingDays !== undefined) updateData.workingDays = workingDays;
    if (sessionDuration !== undefined) updateData.sessionDuration = sessionDuration;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (enableSMS !== undefined) updateData.enableSMS = enableSMS;
    if (enableEmail !== undefined) updateData.enableEmail = enableEmail;
    if (absenceTemplate !== undefined) updateData.absenceTemplate = absenceTemplate;
    if (invoiceTemplate !== undefined) updateData.invoiceTemplate = invoiceTemplate;
    if (reminderTemplate !== undefined) updateData.reminderTemplate = reminderTemplate;

    const institution = await db.institution.update({
      where: { id: institutionId },
      data: updateData,
    });

    return NextResponse.json(institution);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
