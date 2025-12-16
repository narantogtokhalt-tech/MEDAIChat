// src/app/(dashboard)/loading.tsx
export default function LoadingDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />
        <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />
        <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />
      </div>
    </div>
  );
}