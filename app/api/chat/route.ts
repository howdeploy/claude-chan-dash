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

/** Check if Clawdbot/OpenClaw gateway is configured */
function getGatewayConfig() {
  const url = process.env.CLAWDBOT_GATEWAY_URL;
  const token = process.env.CLAWDBOT_GATEWAY_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/+$/, ''), token };
  }
  return null;
}

/** Call Clawdbot/OpenClaw via OpenAI-compatible gateway API */
async function callGateway(message: string, history: Message[]): Promise<string> {
  const gateway = getGatewayConfig()!;

  // Build messages array with recent history for context
  const contextMessages = history.slice(-20).map(m => ({
    role: m.role,
    content: m.content,
  }));
  contextMessages.push({ role: 'user' as const, content: message });

  const res = await fetch(`${gateway.url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gateway.token}`,
      'Content-Type': 'application/json',
      'x-clawdbot-agent-id': process.env.CLAWDBOT_AGENT_ID || 'main',
    },
    body: JSON.stringify({
      model: process.env.CLAWDBOT_MODEL || 'clawdbot:main',
      messages: contextMessages,
      stream: false,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Gateway ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Пустой ответ от ассистента';
}

/** Fallback: call claude CLI in non-interactive mode */
function callClaudeCli(message: string): string {
  const escaped = message.replace(/'/g, "'\\''");
  return execSync(
    `unset CLAUDECODE && claude --print '${escaped}'`,
    {
      encoding: 'utf-8',
      timeout: 120000,
      env: { ...process.env, CLAUDECODE: '' },
      cwd: os.homedir(),
    }
  ).trim();
}

export function GET() {
  const messages = loadHistory();
  const gateway = getGatewayConfig();
  return NextResponse.json({
    messages,
    backend: gateway ? 'gateway' : 'claude-cli',
  });
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

    // Call the configured backend
    let response: string;
    try {
      const gateway = getGatewayConfig();
      if (gateway) {
        // Clawdbot/OpenClaw gateway — sends history for context, same session
        response = await callGateway(message.trim(), history.slice(0, -1));
      } else {
        // Fallback: isolated claude --print call
        response = callClaudeCli(message.trim());
      }
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
