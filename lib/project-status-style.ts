export function getProjectStatusStyle(statusCode: number) {
  const styles: Record<
    number,
    {
      dot: string;
      text: string;
      badge: string;
      softBackground: string;
    }
  > = {
    1: {
      dot: "bg-amber-400",
      text: "text-amber-800",
      badge: "bg-amber-100 text-amber-800",
      softBackground: "bg-amber-50",
    },
    2: {
      dot: "bg-blue-500",
      text: "text-blue-800",
      badge: "bg-blue-100 text-blue-800",
      softBackground: "bg-blue-50",
    },
    3: {
      dot: "bg-violet-500",
      text: "text-violet-800",
      badge: "bg-violet-100 text-violet-800",
      softBackground: "bg-violet-50",
    },
    4: {
      dot: "bg-emerald-500",
      text: "text-emerald-800",
      badge: "bg-emerald-100 text-emerald-800",
      softBackground: "bg-emerald-50",
    },
    5: {
      dot: "bg-zinc-700",
      text: "text-zinc-800",
      badge: "bg-zinc-200 text-zinc-800",
      softBackground: "bg-zinc-50",
    },
    6: {
      dot: "bg-red-500",
      text: "text-red-800",
      badge: "bg-red-100 text-red-800",
      softBackground: "bg-red-50",
    },
    7: {
      dot: "bg-amber-800",
      text: "text-amber-950",
      badge: "bg-amber-200 text-amber-950",
      softBackground: "bg-amber-50",
    },
    8: {
      dot: "bg-slate-400",
      text: "text-slate-700",
      badge: "bg-slate-100 text-slate-700",
      softBackground: "bg-slate-50",
    },
  };

  return styles[statusCode] ?? styles[1];
}
