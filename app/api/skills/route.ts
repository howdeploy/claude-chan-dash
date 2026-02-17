import { NextResponse } from 'next/server';
import { getAllSkills } from '@/lib/services/skill-scanner';

export function GET() {
  const skills = getAllSkills();
  return NextResponse.json({ skills });
}
