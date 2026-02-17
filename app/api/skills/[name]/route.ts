import { NextRequest, NextResponse } from 'next/server';
import { getSkillContent, saveSkillContent } from '@/lib/services/skill-scanner';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const content = getSkillContent(name);
  if (!content) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }
  return NextResponse.json({ name, content });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  try {
    const { content } = await request.json();
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }
    const saved = saveSkillContent(name, content);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
