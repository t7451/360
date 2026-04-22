import { CreditCard, CheckCircle, Clock, Cpu, Layers, Eye, Download } from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: TimelineStep[] = [
  { key: 'pending_payment', label: 'Awaiting Payment', description: 'Complete payment to begin', icon: <CreditCard size={16} /> },
  { key: 'paid', label: 'Payment Confirmed', description: 'Payment received', icon: <CheckCircle size={16} /> },
  { key: 'queued', label: 'Queued', description: 'In the render queue', icon: <Clock size={16} /> },
  { key: 'processing', label: 'Processing', description: 'Building 3D scene', icon: <Cpu size={16} /> },
  { key: 'rendering', label: 'Rendering', description: 'Generating final output', icon: <Layers size={16} /> },
  { key: 'review', label: 'Review', description: 'Quality check in progress', icon: <Eye size={16} /> },
  { key: 'completed', label: 'Completed', description: 'Assets ready to download', icon: <Download size={16} /> },
];

interface OrderTimelineProps {
  currentStatus: string;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStatus);

  const isFailed = currentStatus === 'failed';
  const isRefunded = currentStatus === 'refunded';

  // For failed/refunded, treat as if stuck at the rendering step
  const effectiveIndex = (isFailed || isRefunded)
    ? STEPS.findIndex(s => s.key === 'rendering')
    : currentIndex;

  return (
    <div className="relative">
      {STEPS.map((step, index) => {
        const isDone = index < effectiveIndex;
        const isActive = index === effectiveIndex;
        const isFuture = index > effectiveIndex;

        return (
          <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
            {/* Left: dot + connector line */}
            <div className="flex flex-col items-center">
              <div className={`
                flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500
                ${isDone ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : ''}
                ${isActive && !isFailed && !isRefunded ? 'border-purple-500 bg-purple-500/20 text-purple-400' : ''}
                ${(isFailed || isRefunded) && isActive ? 'border-red-500 bg-red-500/20 text-red-400' : ''}
                ${isFuture ? 'border-zinc-700 bg-zinc-900 text-zinc-600' : ''}
              `}>
                {isDone ? (
                  <CheckCircle size={14} />
                ) : isActive ? (
                  <span className={(isFailed || isRefunded) ? '' : 'animate-pulse'}>{step.icon}</span>
                ) : (
                  step.icon
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`mt-1 w-0.5 flex-1 min-h-4 ${isDone ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
              )}
            </div>

            {/* Right: label + description */}
            <div className="pt-1 pb-2">
              <p className={`text-sm font-medium ${
                isDone ? 'text-emerald-400' :
                isActive ? ((isFailed || isRefunded) ? 'text-red-400' : 'text-white') :
                'text-zinc-600'
              }`}>
                {step.label}
              </p>
              <p className={`text-xs ${isFuture ? 'text-zinc-700' : 'text-zinc-500'}`}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}

      {isFailed && (
        <div className="mt-2 rounded-lg bg-red-950/40 border border-red-900/50 px-4 py-3">
          <p className="text-sm text-red-400">Render failed. Please contact support or resubmit.</p>
        </div>
      )}
      {isRefunded && (
        <div className="mt-2 rounded-lg bg-zinc-900/60 border border-zinc-700 px-4 py-3">
          <p className="text-sm text-zinc-400">This order has been refunded.</p>
        </div>
      )}
    </div>
  );
}
