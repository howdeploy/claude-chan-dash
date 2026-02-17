import { NextRequest, NextResponse } from 'next/server';
import { deleteFileByPath } from '@/lib/services/file-scanner';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = decodeURIComponent(pathSegments.join('/'));

  // Block path traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const deleted = deleteFileByPath(filePath);
  if (!deleted) {
    return NextResponse.json({ error: 'File not found or cannot be deleted' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
