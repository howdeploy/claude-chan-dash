import { NextRequest, NextResponse } from 'next/server';
import { getWorkspacePath } from '@/lib/services/config-store';
import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_SIZE } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Allowed extensions: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (safeName.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const workspace = getWorkspacePath();
    const uploadDir = path.join(workspace, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const destPath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    return NextResponse.json({ success: true, name: safeName }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
