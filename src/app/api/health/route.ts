import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/health
 * Endpoint diagnostik — cek koneksi Supabase & waktu query.
 * Hapus atau protect endpoint ini sebelum deploy ke production.
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ SET" : "❌ MISSING",
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith("eyJ")
          ? "✅ JWT format"
          : `⚠️ Non-JWT format (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)`
        : "❌ MISSING",
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("eyJ")
          ? "✅ JWT format"
          : "⚠️ Non-JWT format"
        : "❌ MISSING",
      nextauth_secret: process.env.NEXTAUTH_SECRET ? "✅ SET" : "❌ MISSING",
    },
    queries: {} as Record<string, any>,
  };

  const supabase = createServiceClient();

  // Test 1: ping admins table
  const t1 = Date.now();
  try {
    const { count, error } = await supabase
      .from("admins")
      .select("*", { count: "exact", head: true });
    results.queries.admins = { ms: Date.now() - t1, count, error: error?.message || null };
  } catch (e: any) {
    results.queries.admins = { ms: Date.now() - t1, error: e.message };
  }

  // Test 2: ping batches table
  const t2 = Date.now();
  try {
    const { count, error } = await supabase
      .from("batches")
      .select("*", { count: "exact", head: true });
    results.queries.batches = { ms: Date.now() - t2, count, error: error?.message || null };
  } catch (e: any) {
    results.queries.batches = { ms: Date.now() - t2, error: e.message };
  }

  // Test 3: ping students table
  const t3 = Date.now();
  try {
    const { count, error } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });
    results.queries.students = { ms: Date.now() - t3, count, error: error?.message || null };
  } catch (e: any) {
    results.queries.students = { ms: Date.now() - t3, error: e.message };
  }

  // Test 4: ping templates table
  const t4 = Date.now();
  try {
    const { count, error } = await supabase
      .from("certificate_templates")
      .select("*", { count: "exact", head: true });
    results.queries.templates = { ms: Date.now() - t4, count, error: error?.message || null };
  } catch (e: any) {
    results.queries.templates = { ms: Date.now() - t4, error: e.message };
  }

  // Evaluasi keseluruhan
  const hasError = Object.values(results.queries).some((q: any) => q.error);
  const maxMs = Math.max(...Object.values(results.queries).map((q: any) => q.ms || 0));

  results.status = hasError ? "❌ ERROR" : maxMs > 3000 ? "⚠️ SLOW" : "✅ OK";
  results.slowest_query_ms = maxMs;

  return NextResponse.json(results, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
