import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/services/config-store';

export function GET() {
  const config = getConfig();
  return NextResponse.json({
    agentName: config.agentName,
    refreshInterval: config.refreshInterval,
    themeIndex: config.themeIndex,
    workspacePath: config.workspacePath,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const allowed = ['agentName', 'refreshInterval', 'themeIndex'];
    const updates: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    saveConfig(updates);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
