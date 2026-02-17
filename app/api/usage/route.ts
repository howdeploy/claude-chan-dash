import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATS_PATH = path.join(os.homedir(), '.claude', 'stats-cache.json');

// Max 5x plan estimated limits (Opus model)
const LIMITS = {
  fiveHour: { messages: 5000, tokens: 500_000 },
  daily: { messages: 8000, tokens: 800_000 },
  weekly: { messages: 40000, tokens: 4_000_000 },
  monthly: { messages: 150000, tokens: 15_000_000 },
};

interface DailyEntry {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

interface TokenEntry {
  date: string;
  tokensByModel: Record<string, number>;
}

function sumTokens(entries: TokenEntry[]): number {
  return entries.reduce((a, d) =>
    a + Object.values(d.tokensByModel).reduce((s, v) => s + (v as number), 0), 0);
}

function fmtTokens(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

function pct(used: number, limit: number): number {
  return Math.min(100, Math.round((used / limit) * 100));
}

export function GET() {
  try {
    const raw = fs.readFileSync(STATS_PATH, 'utf-8');
    const stats = JSON.parse(raw);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Today
    const todayActivity: DailyEntry | undefined = (stats.dailyActivity || []).find(
      (d: DailyEntry) => d.date === today
    );
    const todayTokens: TokenEntry | undefined = (stats.dailyModelTokens || []).find(
      (d: TokenEntry) => d.date === today
    );
    const todayMsg = todayActivity?.messageCount || 0;
    const todayTok = todayTokens ? sumTokens([todayTokens]) : 0;

    // 5h window — approximate from today's data (best we can do without timestamps)
    const hoursToday = now.getHours() + now.getMinutes() / 60;
    const fiveHourRatio = Math.min(1, 5 / Math.max(hoursToday, 1));
    const fiveHourMsg = Math.round(todayMsg * fiveHourRatio);
    const fiveHourTok = Math.round(todayTok * fiveHourRatio);

    // Week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    const weekActivity = (stats.dailyActivity || []).filter((d: DailyEntry) => d.date >= weekStr);
    const weekMsg = weekActivity.reduce((a: number, d: DailyEntry) => a + d.messageCount, 0);
    const weekTok = sumTokens((stats.dailyModelTokens || []).filter((d: TokenEntry) => d.date >= weekStr));

    // Month
    const monthStart = `${today.slice(0, 7)}-01`;
    const monthActivity = (stats.dailyActivity || []).filter((d: DailyEntry) => d.date >= monthStart);
    const monthMsg = monthActivity.reduce((a: number, d: DailyEntry) => a + d.messageCount, 0);
    const monthTok = sumTokens((stats.dailyModelTokens || []).filter((d: TokenEntry) => d.date >= monthStart));

    // Model
    const modelUsage = stats.modelUsage || {};
    const currentModel = Object.keys(modelUsage).reduce((best, key) => {
      const m = modelUsage[key];
      const t = (m.outputTokens || 0) + (m.inputTokens || 0);
      const bt = best ? (modelUsage[best].outputTokens || 0) + (modelUsage[best].inputTokens || 0) : 0;
      return t > bt ? key : best;
    }, '');

    return NextResponse.json({
      plan: 'Max (5x)',
      model: currentModel,
      meters: [
        {
          label: '5 часов',
          messages: fiveHourMsg,
          tokens: fmtTokens(fiveHourTok),
          pctMessages: pct(fiveHourMsg, LIMITS.fiveHour.messages),
          pctTokens: pct(fiveHourTok, LIMITS.fiveHour.tokens),
        },
        {
          label: 'Сегодня',
          messages: todayMsg,
          tokens: fmtTokens(todayTok),
          pctMessages: pct(todayMsg, LIMITS.daily.messages),
          pctTokens: pct(todayTok, LIMITS.daily.tokens),
        },
        {
          label: 'Неделя',
          messages: weekMsg,
          tokens: fmtTokens(weekTok),
          pctMessages: pct(weekMsg, LIMITS.weekly.messages),
          pctTokens: pct(weekTok, LIMITS.weekly.tokens),
        },
        {
          label: 'Месяц',
          messages: monthMsg,
          tokens: fmtTokens(monthTok),
          pctMessages: pct(monthMsg, LIMITS.monthly.messages),
          pctTokens: pct(monthTok, LIMITS.monthly.tokens),
        },
      ],
      total: {
        sessions: stats.totalSessions || 0,
        messages: stats.totalMessages || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Stats unavailable' }, { status: 500 });
  }
}
