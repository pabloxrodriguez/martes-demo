import type { ReactNode } from "react";

type ProjectDetailsCardProps = {
  children: ReactNode;
};

export function ProjectDetailsCard({
  children,
}: ProjectDetailsCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}