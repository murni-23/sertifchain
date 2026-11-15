"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page Title */}
          <div>
            <h1 className="heading-brutal text-2xl mb-1">{pageInfo.title}</h1>
            <p className="text-sm text-slate-500">
              {pageInfo.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              className="p-3 rounded-md bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
