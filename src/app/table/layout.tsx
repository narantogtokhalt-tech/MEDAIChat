import { TopNav } from "@/components/nav";

export default function TableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Дээд нав */}
      <TopNav title="Үзүүлэлтийн жагсаалт" />

      {/* Гол контент */}
      <main className="min-h-screen">{children}</main>
    </>
  );
}