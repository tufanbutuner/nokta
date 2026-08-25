import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminPageShell({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-clay-50 font-primary text-sheesh-ink">
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar activePath={activePath} />
        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
