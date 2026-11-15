"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/admin/dashboard": {
    title: "Dashboard",
    description: "Ringkasan data sertifikat dan aktivitas terbaru",
  },
  "/admin/batches": {
    title: "Batch Siswa",
    description: "Kelola batch/angkatan siswa dan sertifikat",
  },
  "/admin/students": {
    title: "Data Siswa",
    description: "Kelola data siswa dan status klaim sertifikat",
  },
  "/admin/templates": {
    title: "Template Sertifikat",
    description: "Kelola dan tambah desain template sertifikat PDF",
  },
};

export function AdminHeader() {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || {
    title: "Admin Panel",
    description: "SertifChain",
  };

  return (
    <header className="sticky top-0 z-10 border-b border-[#eee9f3] bg-white/95">
      <div className="px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          {/* Page Title */}
          <div>
            <h1 className="heading-brutal mb-1 text-xl sm:text-2xl">{pageInfo.title}</h1>
            <p className="hidden text-sm text-[#81788a] sm:block">
              {pageInfo.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#eee9f3] bg-[#faf8fc] px-3 py-2 text-xs font-semibold text-[#68408b]">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin workspace</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
