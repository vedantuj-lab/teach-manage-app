import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action, back = true }: { title: string; subtitle?: string; action?: ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b">
      <div className="flex items-center gap-2 px-4 py-3">
        {back && (
          <button
            onClick={() => router.history.length > 1 ? router.history.back() : router.navigate({ to: "/" })}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export { Link };
