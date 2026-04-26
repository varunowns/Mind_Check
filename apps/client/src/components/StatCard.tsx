import type { PropsWithChildren } from "react";

export const StatCard = ({ label, value, children }: PropsWithChildren<{ label: string; value: string | number }>) => (
  <div className="glass rounded-3xl border p-5 shadow-soft">
    <p className="text-sm text-subtle">{label}</p>
    <p className="mt-2 text-3xl font-semibold">{value}</p>
    {children ? <div className="mt-3 text-sm text-muted">{children}</div> : null}
  </div>
);
