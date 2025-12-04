// D:\Projects\visactor-nextjs-template\src\components\chart-blocks\charts\metrics\index.tsx

import Container from "@/components/container";
import MetricCard from "./components/metric-card";
import { getMetrics } from "@/data/metrics";

export const dynamic = "force-dynamic"; // Always fetch fresh backend data

export default async function Metrics() {
  const metrics = await getMetrics();

  return (
    <Container className="grid grid-cols-1 gap-y-6 border-b border-border py-4 phone:grid-cols-2 laptop:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </Container>
  );
}
