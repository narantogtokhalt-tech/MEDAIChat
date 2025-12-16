// D:\Projects\visactor-nextjs-template\src\app\(dashboard)\page.tsx

import Container from "@/components/container";
import ChatbotWidget from "@/components/ChatbotWidget";

import { getDashboardData } from "@/data/dashboard";

// Metrics чинь одоогоор server/client аль нь гэдгээс шалтгаад import өөр байж болно.
// Одоогийнхоо замыг хадгалаад props нэмээд явуулна:
import { Metrics } from "@/components/chart-blocks";

import {
  AverageTicketsCreated,
  Conversions,
  CustomerSatisfication,
  TicketByChannels,
} from "@/components/chart-blocks/client";

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <>
      <div>
        {/* ✅ server дээр татсан data-г props-оор */}
        <Metrics metrics={dashboard.metrics} />

        <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
          <Container className="py-4 laptop:col-span-2">
            <AverageTicketsCreated data={dashboard.productsMonthly} />
          </Container>

          <Container className="py-4 laptop:col-span-1">
            <Conversions data={dashboard.exchangeTimeline} />
          </Container>
        </div>

        <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
          <Container className="py-4 laptop:col-span-1">
            <TicketByChannels
              pieData={dashboard.productsValuePie}
              yearLabel={dashboard.productsValueYearLabel}
              exportTotal={dashboard.productsValueExportTotal}
            />
          </Container>

          <Container className="py-4 laptop:col-span-1">
            <CustomerSatisfication data={dashboard.coalLatest} />
          </Container>
        </div>
      </div>

      {/* Floating chatbot widget – бүх dashboard дээр давхар гарна */}
      <ChatbotWidget />
    </>
  );
}