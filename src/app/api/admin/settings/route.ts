import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// In-memory platform settings (no DB model for this, stored in memory)
let platformSettings = {
  siteName: 'EduTrack',
  siteDescription: 'منصة تسيير المؤسسات التعليمية',
  contactEmail: 'admin@edutrack.dz',
  contactPhone: '+213 000 000 000',
  contactAddress: 'الجزائر',
  maintenanceMode: false,
  registrationEnabled: true,
};

export async function GET() {
  try {
    return NextResponse.json(platformSettings);
  } catch (error) {
    console.error('Admin settings get error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل الإعدادات' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'platform') {
      const { siteName, siteDescription, contactEmail, contactPhone, contactAddress } = body;
      if (siteName !== undefined) platformSettings.siteName = siteName;
      if (siteDescription !== undefined) platformSettings.siteDescription = siteDescription;
      if (contactEmail !== undefined) platformSettings.contactEmail = contactEmail;
      if (contactPhone !== undefined) platformSettings.contactPhone = contactPhone;
      if (contactAddress !== undefined) platformSettings.contactAddress = contactAddress;
    } else if (type === 'system') {
      const { maintenanceMode, registrationEnabled } = body;
      if (typeof maintenanceMode === 'boolean') platformSettings.maintenanceMode = maintenanceMode;
      if (typeof registrationEnabled === 'boolean') platformSettings.registrationEnabled = registrationEnabled;
    } else {
      return NextResponse.json(
        { error: 'نوع الإعداد غير صالح' },
        { status: 400 }
      );
    }

    return NextResponse.json(platformSettings);
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الإعدادات' },
      { status: 500 }
    );
  }
}
