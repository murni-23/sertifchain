"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileImage,
  LogOut,
  Award,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const navigation: NavItem[] = [
  {
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: "Dashboard",
  },
  {
    href: "/admin/batches",
    icon: <FolderKanban className="w-5 h-5" />,
    label: "Batch Siswa",
  },
  {
    href: "/admin/students",
    icon: <Users className="w-5 h-5" />,
    label: "Data Siswa",
  },
  {
    href: "/admin/templates",
    icon: <FileImage className="w-5 h-5" />,
    label: "Template",
  },
];

interface AdminSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutConfirmOpen(false);
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false, callbackUrl: "/admin/login" });
      window.location.assign("/admin/login");
    } catch (error) {
      console.error("Admin logout error:", error);
      toast.error("Gagal keluar. Silakan coba lagi.");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#eee9f3] bg-white px-5 py-3.5 md:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5b2b82] text-white">
            <Award className="h-5 w-5" fill="currentColor" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-[#3d2057]">SertifChain</span>
            <span className="block text-[10px] font-medium tracking-wide text-[#81788a]">ADMIN PANEL</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee9f3] bg-white text-[#5b2b82]"
          aria-label="Buka navigasi"
          aria-expanded={isMobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#21152d]/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Tutup navigasi"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,85vw)] flex-col border-r border-[#eee9f3] bg-white shadow-[0_20px_60px_rgba(34,20,48,0.12)] transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0 md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="border-b border-[#eee9f3] px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="block" onClick={() => setIsMobileOpen(false)}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5b2b82] text-white shadow-[0_8px_20px_rgba(91,43,130,0.18)]">
                  <Award className="h-6 w-6" fill="currentColor" />
                </span>
                <span>
                  <span className="block text-lg font-bold leading-tight tracking-tight text-[#3d2057]">
                    SertifChain
                  </span>
                  <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.12em] text-[#81788a]">
                    ADMIN PANEL
                  </span>
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#eee9f3] text-[#6e6478] md:hidden"
              aria-label="Tutup navigasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.14em] text-[#9b91a3]">
            MENU UTAMA
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-[#f1e9f8] text-[#5b2b82]"
                    : "text-[#6e6478] hover:bg-[#faf8fc] hover:text-[#3d2c4d]"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#eee9f3] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#faf8fc] p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9def1] text-sm font-bold text-[#5b2b82]">
              {(userName || "A").trim().charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#3d2c4d]">
                {userName || "Admin"}
              </span>
              <span className="block truncate text-xs text-[#81788a]">{userEmail}</span>
            </span>
          </div>

          <Button
            type="button"
            variant="white"
            className="!w-full !justify-start !rounded-xl !border-[#eee9f3] !shadow-none !text-[#6e6478] hover:!bg-[#faf8fc]"
            onClick={() => setIsLogoutConfirmOpen(true)}
            isLoading={isLoggingOut}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Keluar
          </Button>
        </div>
      </aside>

      <Modal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Konfirmasi Keluar"
        size="sm"
      >
        <p className="text-slate-700">Anda yakin mau keluar dari halaman ini?</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="white"
            onClick={() => setIsLogoutConfirmOpen(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="black"
            onClick={handleLogout}
            isLoading={isLoggingOut}
          >
            Ya, Keluar
          </Button>
        </div>
      </Modal>
    </>
  );
}
