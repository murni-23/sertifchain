"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { Upload, Download, FileText, CheckCircle, XCircle } from "lucide-react";

interface BulkUploadStudentsProps {
  batchId: string;
  onSuccess: () => void;
}

interface ParsedStudent {
  name: string;
}

export function BulkUploadStudents({
  batchId,
  onSuccess,
}: BulkUploadStudentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const parseCSV = (file: File): Promise<ParsedStudent[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const students = results.data.map((row: any) => {
              const name = row.nama || row.name || row.Nama || row.Name || row.NAMA || row.NAME;
              if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Kolom 'nama' atau 'name' tidak ditemukan atau kosong");
              }
              return { name: name.trim() };
            });
            resolve(students);
          } catch (error: any) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  };

  const parseExcel = (file: File): Promise<ParsedStudent[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const students = jsonData.map((row: any) => {
            const name = row.nama || row.name || row.Nama || row.Name || row.NAMA || row.NAME;
            if (!name || typeof name !== "string" || name.trim() === "") {
              throw new Error("Kolom 'nama' atau 'name' tidak ditemukan atau kosong");
            }
            return { name: name.trim() };
          });

          resolve(students);
        } catch (error: any) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);

    try {
      let students: ParsedStudent[];

      if (file.name.endsWith(".csv")) {
        students = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        students = await parseExcel(file);
      } else {
        toast.error("Format file tidak didukung. Gunakan CSV atau Excel (.xlsx)");
        return;
      }

      if (students.length === 0) {
        toast.error("File tidak berisi data siswa");
        return;
      }

      if (students.length > 1000) {
        toast.error("Maksimal 1000 siswa per upload");
        return;
      }

      setParsedData(students);
      toast.success(`Berhasil membaca ${students.length} siswa dari file`);
    } catch (error: any) {
      console.error("Parse error:", error);
      toast.error(error.message || "Gagal membaca file");
      setParsedData([]);
      setFileName("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("Tidak ada data untuk diupload");
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch("/api/students/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          students: parsedData,
          batch_id: batchId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload students");
      }

      toast.success(`Berhasil menambahkan ${data.inserted} siswa! 🎉`);
      setParsedData([]);
      setFileName("");
      onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Gagal mengupload data siswa");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const csv = "nama\nJohn Doe\nJane Smith\nBudi Santoso";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-siswa.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template CSV berhasil didownload");
  };

  const handleClear = () => {
    setParsedData([]);
    setFileName("");
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card variant="white">
        <CardHeader>
          <CardTitle as="h3">Upload Data Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`p-8 border-3 border-dashed border-black bg-cream cursor-pointer transition-all ${
              isDragActive ? "bg-yellow/30 shadow-brutal" : "hover:bg-yellow/10"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-sky border-3 border-black shadow-brutal mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="heading-brutal text-xl mb-2">
                {isDragActive
                  ? "Drop file di sini..."
                  : "Drag & Drop atau Klik untuk Upload"}
              </h4>
              <p className="text-sm text-black/60 mb-4">
                Format: CSV atau Excel (.xlsx, .xls)
              </p>
              <p className="text-xs text-black/50 font-semibold">
                Maksimal 1000 siswa per upload
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="white"
              leftIcon={<Download className="w-5 h-5" />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </div>

          {/* Format Info */}
          <div className="mt-6 p-4 bg-pink-light border-2 border-black">
            <h5 className="font-bold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Format File
            </h5>
            <ul className="text-sm space-y-1 font-semibold text-black/80">
              <li>• Kolom wajib: "nama" atau "name"</li>
              <li>• Header harus ada di baris pertama</li>
              <li>• Satu nama per baris</li>
              <li>• Kode unik akan otomatis digenerate</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Preview Data */}
      {parsedData.length > 0 && (
        <Card variant="yellow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle as="h3">Preview Data</CardTitle>
                <p className="text-sm text-black/70 font-semibold mt-1">
                  File: {fileName} • {parsedData.length} siswa
                </p>
              </div>
              <Button variant="white" onClick={handleClear} className="py-1 px-2">
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto bg-white border-2 border-black p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 px-3 font-bold">#</th>
                    <th className="text-left py-2 px-3 font-bold">Nama Siswa</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 100).map((student, index) => (
                    <tr
                      key={index}
                      className="border-b border-black/10 hover:bg-cream"
                    >
                      <td className="py-2 px-3 text-sm font-semibold text-black/60">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold">{student.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 100 && (
                <p className="text-center text-sm text-black/60 mt-4 font-semibold">
                  ... dan {parsedData.length - 100} siswa lainnya
                </p>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                variant="white"
                onClick={handleClear}
                className="flex-1"
                disabled={isUploading}
              >
                Batal
              </Button>
              <Button
                variant="mint"
                onClick={handleUpload}
                isLoading={isUploading}
                rightIcon={<CheckCircle className="w-5 h-5" />}
                className="flex-1"
              >
                Upload {parsedData.length} Siswa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
