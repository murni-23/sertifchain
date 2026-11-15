import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate kode unik yang mudah dibaca (bukan 0,O,I,l agar tidak membingungkan)
const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

export function generateUniqueCode(): string {
  return nanoid();
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Menunggu",
    generated: "Siap Diklaim",
    unclaimed: "Belum Diklaim",
    claimed: "Sudah Diklaim",
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-orange-light text-orange border-orange",
    generated: "bg-purple-light text-purple border-purple",
    unclaimed: "bg-yellow-light text-black border-yellow",
    claimed: "bg-mint/20 text-mint border-mint",
  };
  return map[status] ?? "bg-gray-100 text-gray-600 border-gray-300";
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Chunk array into smaller arrays of given size */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
