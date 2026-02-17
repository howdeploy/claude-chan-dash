'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchProcesses, type Process } from '@/lib/api-client';
import { formatTime } from '@/lib/formatters';
import Card from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function ProcessList() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchProcesses();
      setProcesses(data.processes || []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && processes.length === 0) return <LoadingState text="Loading processes" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (processes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--overlay0)', fontSize: '0.8125rem' }}>
        Нет процессов
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {processes.map(proc => (
        <Card key={proc.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9375rem', color: 'var(--text)', fontWeight: 600 }}>{proc.name}</span>
            <StatusBadge status={proc.status} />
            <span className="badge badge--cron">CRON</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--overlay1)', marginBottom: 10, lineHeight: 1.4 }}>
            {proc.description}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'schedule', value: proc.schedule || '—' },
              { label: 'last run', value: formatTime(proc.lastRun) },
              { label: 'next run', value: formatTime(proc.nextRun) },
            ].map(item => (
              <div key={item.label} style={{ fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--overlay0)' }}>{item.label}: </span>
                <span style={{ color: 'var(--accent-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
