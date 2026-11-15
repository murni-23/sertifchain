import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnedBatchIds } from "@/lib/admin/ownership";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Users, Award, TrendingUp, CheckCircle } from "lucide-react";

async function getDashboardStats(adminId: string) {
  const supabase = createServiceClient();
  const batchIds = await getOwnedBatchIds(supabase, adminId);
  if (batchIds.length === 0) {
    return {
      totalStudents: 0,
      claimedCount: 0,
      unclaimedCount: 0,
      totalBatches: 0,
      claimRate: 0,
      recentClaims: [],
    };
  }

  // Get total students
  const { count: totalStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .in("batch_id", batchIds);

  // Get claimed certificates
  const { count: claimedCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "claimed")
    .in("batch_id", batchIds);

  // Get total batches
  const { count: totalBatches } = await supabase
    .from("batches")
    .select("*", { count: "exact", head: true })
    .eq("admin_id", adminId);

  // Get recent activities (last 10 claimed certificates)
  const { data: recentClaims } = await supabase
    .from("students")
    .select("id, name, claimed_at, batch_id, batches(name)")
    .eq("status", "claimed")
    .in("batch_id", batchIds)
    .order("claimed_at", { ascending: false })
    .limit(10);

  return {
    totalStudents: totalStudents || 0,
    claimedCount: claimedCount || 0,
    unclaimedCount: (totalStudents || 0) - (claimedCount || 0),
    totalBatches: totalBatches || 0,
    claimRate:
      totalStudents && totalStudents > 0
        ? Math.round(((claimedCount || 0) / totalStudents) * 100)
        : 0,
    recentClaims: recentClaims || [],
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-yellow border-3 border-black shadow-brutal-lg p-6 rotate-playful-1">
        <h2 className="heading-brutal text-2xl mb-2">
          Selamat Datang, {session.user?.name}! 👋
        </h2>
        <p className="font-semibold text-black/70">
          Kelola sertifikat siswa bimbel Anda dengan mudah
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <Card variant="white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h3" className="text-xl">
                Total Siswa
              </CardTitle>
              <div className="p-3 bg-sky border-2 border-black">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="heading-brutal text-4xl mb-2">{stats.totalStudents}</p>
            <p className="text-sm text-black/60 font-semibold">
              Terdaftar dalam sistem
            </p>
          </CardContent>
        </Card>

        {/* Claimed Certificates */}
        <Card variant="mint">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h3" className="text-xl">
                Sudah Diklaim
              </CardTitle>
              <div className="p-3 bg-mint border-2 border-black">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="heading-brutal text-4xl mb-2">{stats.claimedCount}</p>
            <p className="text-sm text-black/60 font-semibold">
              Sertifikat telah diambil
            </p>
          </CardContent>
        </Card>

        {/* Unclaimed Certificates */}
        <Card variant="yellow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h3" className="text-xl">
                Belum Diklaim
              </CardTitle>
              <div className="p-3 bg-orange border-2 border-black">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="heading-brutal text-4xl mb-2">
              {stats.unclaimedCount}
            </p>
            <p className="text-sm text-black/60 font-semibold">
              Menunggu diklaim siswa
            </p>
          </CardContent>
        </Card>

        {/* Claim Rate */}
        <Card variant="pink">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle as="h3" className="text-xl">
                Tingkat Klaim
              </CardTitle>
              <div className="p-3 bg-pink border-2 border-black">
                <TrendingUp className="w-6 h-6 text-[#a04e70]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="heading-brutal text-4xl mb-2">{stats.claimRate}%</p>
            <p className="text-sm text-black/60 font-semibold">
              Dari total sertifikat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card variant="white">
        <CardHeader>
          <CardTitle as="h3">Aktivitas Terbaru</CardTitle>
          <CardDescription>
            Sertifikat yang baru diklaim oleh siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentClaims.length === 0 ? (
            <div className="text-center py-8 text-black/60">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-semibold">Belum ada sertifikat yang diklaim</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentClaims.map((claim: any) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-4 bg-cream border-2 border-black"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-mint border-2 border-black flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">{claim.name}</p>
                      <p className="text-sm text-black/60">
                        {claim.batches?.name || "Unknown Batch"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Diklaim</Badge>
                    <p className="text-xs text-black/60 mt-1">
                      {claim.claimed_at
                        ? new Date(claim.claimed_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Summary */}
      <Card variant="white">
        <CardHeader>
          <CardTitle as="h3">Ringkasan Batch</CardTitle>
          <CardDescription>
            Total {stats.totalBatches} batch siswa terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalBatches === 0 ? (
            <div className="text-center py-8 text-black/60">
              <p className="font-semibold">
                Belum ada batch. Mulai buat batch pertama Anda!
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow border-2 border-black">
                <p className="heading-brutal text-3xl">{stats.totalBatches}</p>
              </div>
              <div>
                <p className="font-bold">Total Batch Aktif</p>
                <p className="text-sm text-black/60">
                  Lihat detail di menu Batch Siswa
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
