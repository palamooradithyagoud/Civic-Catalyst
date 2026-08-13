import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  comingSoon = false,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {comingSoon && (
        <span className="mt-3 inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
          Coming in Phase 2
        </span>
      )}
    </div>
  );
}
