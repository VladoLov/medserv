import { Card } from "../../components/ui/card";

export default function MetricCard({
  title,
  value,
  hint,
  right,
}: {
  title: string;
  value: string | number;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-semibold">{value}</h3>
        </div>
        {right}
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
