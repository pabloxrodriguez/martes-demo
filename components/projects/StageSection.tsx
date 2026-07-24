import Link from "next/link";

type StageSectionProps = {
  title: string;
  count: number;
  viewAllHref: string;
  children?: React.ReactNode;
};

export function StageSection({
  title,
  count,
  viewAllHref,
  children,
}: StageSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-zinc-900">
            {title}
          </h2>

          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600">
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
