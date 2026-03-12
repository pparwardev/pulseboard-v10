import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Metric {
  id: number;
  name: string;
  unit: string;
  is_finalized: boolean;
  created_at: string;
}

interface MetricsContextType {
  metrics: Metric[];
  finalizedMetrics: Metric[];
  loadMetrics: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [finalizedMetrics, setFinalizedMetrics] = useState<Metric[]>([]);

  const loadMetrics = async () => {
    try {
      const res = await api.get('/api/team-metrics/finalized');
      const teams: any[] = res.data || [];
      const allMetrics: Metric[] = [];
      const seen = new Set<string>();
      for (const team of teams) {
        for (const m of team.metrics || []) {
          if (!seen.has(m.metric_code)) {
            seen.add(m.metric_code);
            allMetrics.push({ id: m.id, name: m.metric_code, unit: m.unit || '', is_finalized: true, created_at: '' });
          }
        }
      }
      setMetrics(allMetrics);
      setFinalizedMetrics(allMetrics);
    } catch { /* ignore */ }
  };

  const refreshMetrics = async () => {
    await loadMetrics();
    window.dispatchEvent(new CustomEvent('metricsUpdated'));
  };

  useEffect(() => {
    loadMetrics();
    const handler = () => loadMetrics();
    window.addEventListener('metricConfigChanged', handler);
    return () => window.removeEventListener('metricConfigChanged', handler);
  }, []);

  return (
    <MetricsContext.Provider value={{ metrics, finalizedMetrics, loadMetrics, refreshMetrics }}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (!context) throw new Error('useMetrics must be used within MetricsProvider');
  return context;
}
