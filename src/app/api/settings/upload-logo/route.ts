import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;
    const institutionId = formData.get('institutionId') as string | null;

    if (!file || !institutionId) {
      return NextResponse.json({ error: 'ملف الشعار ومعرف المؤسسة مطلوبان' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم. يُسمح بـ PNG, JPG, WebP, SVG فقط' }, { status: 400 });
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح (2MB)' }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `logo-${institutionId}-${Date.now()}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Save path to database
    const logoUrl = `/uploads/${filename}`;
    await db.institution.update({
      where: { id: institutionId },
      data: { logo: logoUrl },
    });

    return NextResponse.json({ logoUrl, message: 'تم رفع الشعار بنجاح' });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'فشل في رفع الشعار' }, { status: 500 });
  }
}
