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
  Settings,
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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <Link href="/admin/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow flex items-center justify-center border border-slate-200">
              <Award className="w-6 h-6 text-[#2878b8]" />
            </div>
            <div>
              <h1 className="heading-brutal text-xl leading-tight">
                SertifChain
              </h1>
              <p className="text-xs font-bold text-black/70">Admin Panel</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-3 font-semibold transition-colors",
                isActive
                  ? "bg-yellow text-[#21699f]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="mb-3 rounded-md p-3 bg-slate-50 border border-slate-200">
          <p className="font-bold text-sm truncate">{userName || "Admin"}</p>
          <p className="text-xs text-black/60 truncate">{userEmail}</p>
        </div>

        <Button
          type="button"
          variant="black"
          className="w-full"
          onClick={() => setIsLogoutConfirmOpen(true)}
          isLoading={isLoggingOut}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Keluar
        </Button>
      </div>

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
    </aside>
  );
}
