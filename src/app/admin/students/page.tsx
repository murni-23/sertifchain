"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { Users, Search, Filter } from "lucide-react";

interface Student {
  id: string;
  name: string;
  unique_code: string;
  status: string;
  claimed_at: string | null;
  batches: {
    id: string;
    name: string;
  } | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "claimed" | "unclaimed">("all");

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/students");

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
      setFilteredStudents(data.students || []);
    } catch (error) {
      console.error("Fetch students error:", error);
      toast.error("Gagal memuat data siswa");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = students;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.unique_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((student) => student.status === statusFilter);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, statusFilter, students]);

  const stats = {
    total: students.length,
    claimed: students.filter((s) => s.status === "claimed").length,
    unclaimed: students.filter((s) => s.status === "unclaimed").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="white">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/60 mb-1">Total Siswa</p>
                <p className="heading-brutal text-3xl">{stats.total}</p>
              </div>
              <div className="p-3 bg-sky border-2 border-black">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="mint">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/60 mb-1">Sudah Diklaim</p>
                <p className="heading-brutal text-3xl">{stats.claimed}</p>
              </div>
              <div className="p-3 bg-mint border-2 border-black">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="yellow">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-black/60 mb-1">Belum Diklaim</p>
                <p className="heading-brutal text-3xl">{stats.unclaimed}</p>
              </div>
              <div className="p-3 bg-orange border-2 border-black">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="white">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau kode unik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 font-bold border-2 border-black transition-all ${
                  statusFilter === "all"
                    ? "bg-yellow shadow-brutal"
                    : "bg-white hover:bg-yellow/50"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter("claimed")}
                className={`px-4 py-2 font-bold border-2 border-black transition-all ${
                  statusFilter === "claimed"
                    ? "bg-mint shadow-brutal"
                    : "bg-white hover:bg-mint/50"
                }`}
              >
                Diklaim
              </button>
              <button
                onClick={() => setStatusFilter("unclaimed")}
                className={`px-4 py-2 font-bold border-2 border-black transition-all ${
                  statusFilter === "unclaimed"
                    ? "bg-orange shadow-brutal"
                    : "bg-white hover:bg-orange/50"
                }`}
              >
                Belum Diklaim
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card variant="white">
        <CardHeader>
          <CardTitle as="h3">Daftar Siswa</CardTitle>
          <CardDescription>
            Menampilkan {filteredStudents.length} dari {students.length} siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-3 border-black border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 font-semibold text-black/60">Memuat data...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="heading-brutal text-xl mb-2">
                {searchQuery || statusFilter !== "all"
                  ? "Tidak ada hasil"
                  : "Belum ada siswa"}
              </h3>
              <p className="text-black/60">
                {searchQuery || statusFilter !== "all"
                  ? "Coba ubah filter atau kata kunci pencarian"
                  : "Upload siswa melalui menu Batch"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-cream">
                    <th className="text-left py-3 px-4 font-bold">#</th>
                    <th className="text-left py-3 px-4 font-bold">Nama Siswa</th>
                    <th className="text-left py-3 px-4 font-bold">Kode Unik</th>
                    <th className="text-left py-3 px-4 font-bold">Batch</th>
                    <th className="text-left py-3 px-4 font-bold">Status</th>
                    <th className="text-left py-3 px-4 font-bold">Diklaim</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="border-b border-black/10 hover:bg-cream transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-semibold text-black/60">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold">{student.name}</td>
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-yellow border-2 border-black text-sm font-bold">
                          {student.unique_code}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {student.batches?.name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {student.status === "claimed" ? (
                          <Badge variant="success">Diklaim</Badge>
                        ) : (
                          <Badge variant="yellow">Belum Diklaim</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-black/60">
                        {student.claimed_at
                          ? new Date(student.claimed_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
