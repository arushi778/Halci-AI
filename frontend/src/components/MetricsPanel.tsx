import { RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer
} from 'recharts';
import { AuditRecord } from '../lib/api';

interface MetricsPanelProps {
  audit: AuditRecord;
  alerts?: string[];
  onIterate: () => void;
}

export function MetricsPanel({ audit, alerts, onIterate }: MetricsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Integrity Radar</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              cx="50%" cy="50%" outerRadius="80%" 
              data={[
                { subject: 'Factuality', value: audit.overall_scores.factuality },
                { subject: 'Bias (Inv)', value: audit.overall_scores.bias_inverse },
                { subject: 'Safety', value: audit.overall_scores.safety },
                { subject: 'Consistency', value: audit.overall_scores.consistency },
              ]}
            >
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
              <Radar name="Audit" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {alerts && alerts.length > 0 && (
         <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
           <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 mb-3">
             <AlertTriangle className="w-4 h-4" /> System Alerts
           </h3>
           <ul className="space-y-2">
             {alerts.map((a, i) => (
               <li key={i} className="text-sm text-orange-200">
                 • {a}
               </li>
             ))}
           </ul>
         </div>
      )}

      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <button 
          onClick={onIterate}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Iterate Prompt
        </button>
      </div>
    </div>
  );
}
