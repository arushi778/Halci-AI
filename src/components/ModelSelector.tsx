import { PROVIDERS, ProviderId, isProviderConfigured } from '../lib/providers';
import { cn } from '../lib/utils';

interface ModelSelectorProps {
  selectedProvider: ProviderId;
  onProviderChange: (id: ProviderId) => void;
}

export default function ModelSelector({
  selectedProvider,
  onProviderChange,
}: ModelSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map((p) => {
        const isSelected = selectedProvider === p.id;
        const configured = isProviderConfigured(p.id);
        return (
          <button
            key={p.id}
            id={`provider-${p.id}`}
            onClick={() => onProviderChange(p.id)}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
              isSelected
                ? cn(p.bgColor, p.borderColor, 'ring-2', p.borderColor)
                : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
            )}
          >
            <span className="text-2xl">{p.icon}</span>
            <span className={cn('text-xs font-bold', isSelected ? p.color : 'text-zinc-400')}>
              {p.name}
            </span>
            {/* Status dot */}
            <div className={cn(
              'absolute top-2 right-2 w-2 h-2 rounded-full',
              configured ? 'bg-emerald-500' : 'bg-zinc-600'
            )} />
          </button>
        );
      })}
    </div>
  );
}
