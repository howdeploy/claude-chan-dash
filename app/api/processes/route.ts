import { NextResponse } from 'next/server';
import { getProcesses } from '@/lib/services/process-cache';

export function GET() {
  const processes = getProcesses();
  return NextResponse.json({ processes });
}
