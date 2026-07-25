import Link from "next/link";

import { getProjectStatusStyle } from "@/lib/project-status-style";

type StageSectionProps = {
  title: string;
  count: number;
  viewAllHref: string;
  statusCode: number;
  children?: React.ReactNode;
};

export function StageSection({
  title,
  count,
  viewAllHref,
  statusCode,
  children,
}: StageSectionProps) {
  const statusStyle = getProjectStatusStyle(statusCode);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${statusStyle.dot}`}
            aria-hidden="true"
          />

          <h2 className={`text-xl font-semibold ${statusStyle.text}`}>
            {title}
          </h2>

          <span
            className={`rounded-full px-3 py-1 text-sm ${statusStyle.badge}`}
          >
            {count}
          </span>
        </div>

        <Link
          href={viewAllHref}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Ver todos
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {children}
      </div>
    </section>
  );
}
