import type { ReactNode } from "react";

type ProjectHeaderCardProps = {
  children: ReactNode;
};

export function ProjectHeaderCard({
  children,
}: ProjectHeaderCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-200 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </section>
  );
}