import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function StudentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaff] md:h-screen md:min-h-0 md:flex-row">
      <AdminSidebar
        userName={session.user?.name}
        userEmail={session.user?.email}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:overflow-hidden">
        <AdminHeader />
        <main className="flex-1 md:overflow-y-auto">
          <div className="container-brutal py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
