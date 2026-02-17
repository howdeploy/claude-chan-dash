import { NextRequest, NextResponse } from 'next/server';
import { getAllTasks, createTask } from '@/lib/services/task-store';

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters: Record<string, string> = {};
  if (searchParams.get('status')) filters.status = searchParams.get('status')!;
  if (searchParams.get('date')) filters.date = searchParams.get('date')!;
  if (searchParams.get('assignee')) filters.assignee = searchParams.get('assignee')!;

  const tasks = getAllTasks(filters);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const task = createTask({
      title: body.title.trim(),
      priority: body.priority,
      category: body.category,
      date: body.date,
      deadline: body.deadline,
      assignee: body.assignee,
    });

    return NextResponse.json({ success: true, id: task.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
