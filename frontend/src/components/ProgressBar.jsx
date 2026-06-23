/**
 * A budget progress bar. Color rules:
 *  - red when exceeded (>= 100%)
 *  - yellow between 75% and 100%
 *  - green below 75%
 */
export default function ProgressBar({ spent, limit }) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const clamped = Math.min(pct, 100);

  let barColor = 'bg-green-500';
  if (pct >= 100) barColor = 'bg-red-500';
  else if (pct >= 75) barColor = 'bg-yellow-500';

  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <div className="mt-1 text-xs text-gray-500">{pct.toFixed(0)}% used</div>
    </div>
  );
}
