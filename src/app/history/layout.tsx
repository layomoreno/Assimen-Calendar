import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <div className="flex-1 pb-20 md:pb-0 md:ml-[220px] w-full max-w-full overflow-x-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
