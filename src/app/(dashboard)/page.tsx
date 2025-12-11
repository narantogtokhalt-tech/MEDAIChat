// D:\Projects\visactor-nextjs-template\src\app\(dashboard)\page.tsx

import { Metrics } from "@/components/chart-blocks";
import {
  AverageTicketsCreated,
  Conversions,
  CustomerSatisfication,
  TicketByChannels,
} from "@/components/chart-blocks/client";
import Container from "@/components/container";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function Home() {
  return (
    <>
      <div>
        <Metrics />
        <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-3 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
          <Container className="py-4 laptop:col-span-2">
            <AverageTicketsCreated />
          </Container>
          <Container className="py-4 laptop:col-span-1">
            <Conversions />
          </Container>
        </div>
        <div className="grid grid-cols-1 divide-y border-b border-border laptop:grid-cols-2 laptop:divide-x laptop:divide-y-0 laptop:divide-border">
          <Container className="py-4 laptop:col-span-1">
            <TicketByChannels />
          </Container>
          <Container className="py-4 laptop:col-span-1">
            <CustomerSatisfication />
          </Container>
        </div>
      </div>

      {/* Floating chatbot widget – бүх dashboard дээр давхар гарна */}
      <ChatbotWidget />
    </>
  );
}