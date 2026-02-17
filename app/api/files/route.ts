import { NextResponse } from 'next/server';
import { getFiles } from '@/lib/services/file-scanner';

export function GET() {
  const files = getFiles();
  return NextResponse.json({ files });
}
