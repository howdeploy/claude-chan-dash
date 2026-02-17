import { NextRequest, NextResponse } from 'next/server';
import { getFileContent } from '@/lib/services/file-scanner';
import path from 'path';

export function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) {
    return NextResponse.json({ error: 'path parameter required' }, { status: 400 });
  }

  // Block path traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const content = getFileContent(filePath);
  if (content === null) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({
    name: path.basename(filePath),
    path: filePath,
    content,
  });
}
