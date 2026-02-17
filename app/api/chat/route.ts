import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const HISTORY_PATH = path.join(os.homedir(), '.claude-dash', 'chat-history.json');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function loadHistory(): Message[] {
  try {
    const dir = path.dirname(HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(HISTORY_PATH)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveHistory(messages: Message[]): void {
  const dir = path.dirname(HISTORY_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Keep last 100 messages
  const trimmed = messages.slice(-100);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2));
}

export function GET() {
  const messages = loadHistory();
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const history = loadHistory();

    // Add user message
    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    history.push(userMsg);

    // Call claude CLI in non-interactive mode
    let response: string;
    try {
      // Unset CLAUDECODE to allow nested call, use --print for non-interactive
      const escaped = message.replace(/'/g, "'\\''");
      response = execSync(
        `unset CLAUDECODE && claude --print '${escaped}'`,
        {
          encoding: 'utf-8',
          timeout: 120000,
          env: { ...process.env, CLAUDECODE: '' },
          cwd: os.homedir(),
        }
      ).trim();
    } catch (err) {
      response = `Ошибка выполнения: ${(err as Error).message?.slice(0, 200) || 'Неизвестная ошибка'}`;
    }

    // Add assistant message
    const assistantMsg: Message = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    history.push(assistantMsg);
    saveHistory(history);

    return NextResponse.json({ message: assistantMsg, history: history.slice(-50) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(HISTORY_PATH)) fs.unlinkSync(HISTORY_PATH);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to clear' }, { status: 500 });
  }
}
