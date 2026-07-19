import type { ReactNode } from "react";

type TaskCardProps = {
  children: ReactNode;
};

export function TaskCard({ children }: TaskCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </section>
  );
}