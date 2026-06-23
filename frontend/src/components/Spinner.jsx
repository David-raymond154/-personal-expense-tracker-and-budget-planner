export default function Spinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 text-gray-500 ${className}`}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
      <span>{label}</span>
    </div>
  );
}
