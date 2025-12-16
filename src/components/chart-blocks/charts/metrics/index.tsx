// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\metrics\index.tsx

import Container from "@/components/container";
import MetricCard from "./components/metric-card";
import type { Metric } from "@/data/metrics";

type Props = {
  metrics: Metric[] | null;
};

export default function Metrics({ metrics }: Props) {
  const items = Array.isArray(metrics) ? metrics : [];

  return (
    <Container className="grid grid-cols-1 gap-y-6 border-b border-border py-4 phone:grid-cols-2 laptop:grid-cols-4">
      {items.length > 0 ? (
        items.map((metric) => <MetricCard key={metric.title} {...metric} />)
      ) : (
        <div className="col-span-full text-sm text-muted-foreground">
          Metrics өгөгдөл алга.
        </div>
      )}
    </Container>
  );
}