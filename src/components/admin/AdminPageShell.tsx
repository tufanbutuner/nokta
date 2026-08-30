import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminPageShell({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  return (
    <main className="h-screen overflow-hidden bg-clay-50 font-primary text-sheesh-ink">
      <div className="flex h-full min-h-0">
        <AdminSidebar activePath={activePath} />
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
