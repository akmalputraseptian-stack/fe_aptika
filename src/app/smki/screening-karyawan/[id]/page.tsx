"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  Printer,
  FileText,
  User,
  CheckCircle2,
  Info,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import ServiceRouteGuard from "@/components/auth/ServiceRouteGuard";
import {
  getScreeningKaryawanDetail,
  ScreeningKaryawanItem,
} from "@/services/api";
import {
  exportScreeningKaryawanToPdf,
  formatTanggalIndo,
} from "@/utils/smkiScreeningKaryawanPdf";

const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatTimestampIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = BULAN_PENDEK[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export default function DetailScreeningKaryawanPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const [data, setData] = useState<ScreeningKaryawanItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const res = await getScreeningKaryawanDetail(id);
        if (res?.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Gagal memuat detail:", err);
        toast.error("Gagal memuat data detail screening.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDetail();
    }
  }, [id]);

  const handleCetakBeritaAcara = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      toast.loading("Menyiapkan dokumen resmi...", { id: "pdf-export" });
      await exportScreeningKaryawanToPdf(data);
      toast.success("Dokumen Berita Acara berhasil dicetak / diunduh!", {
        id: "pdf-export",
      });
    } catch (err) {
      console.error("Gagal cetak PDF:", err);
      toast.error("Gagal mengekspor dokumen Berita Acara", { id: "pdf-export" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPrintPreview = () => {
    if (typeof window !== "undefined") {
      window.open(`/smki/screening-karyawan/${id}/print`, "_blank");
    }
  };

  if (loading) {
    return (
      <ServiceRouteGuard requiredService="SMKI">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
          <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
          <span>Memuat informasi screening...</span>
        </div>
      </ServiceRouteGuard>
    );
  }

  if (!data) {
    return (
      <ServiceRouteGuard requiredService="SMKI">
        <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
          <AlertCircle size={40} className="mx-auto mb-3 text-rose-500" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">
            Data Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Data screening karyawan yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link
            href="/smki/screening-karyawan"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Kembali ke Daftar</span>
          </Link>
        </div>
      </ServiceRouteGuard>
    );
  }

  const isLengkap = data.kesimpulan === "Administrasi Lengkap";

  return (
    <ServiceRouteGuard requiredService="SMKI">
      <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-16 text-slate-800 dark:text-slate-100">
        {/* Back Link */}
        <div>
          <Link
            href="/smki/screening-karyawan"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Kembali ke Daftar</span>
          </Link>
        </div>

        {/* Page Header & Action Buttons (Matching Image 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Detail Screening Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Informasi lengkap peserta acara screening karyawan outsourcing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Edit Button */}
            <button
              type="button"
              onClick={() => router.push(`/smki/screening-karyawan/${id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>

            {/* Cetak Berita Acara Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleCetakBeritaAcara}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Printer size={15} />
              )}
              <span>Cetak Berita Acara</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CARD 1: INFORMASI DOKUMEN (Matching Image 2)
        ======================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText size={18} />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Informasi Dokumen
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                No. Dokumen
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                FR-012/KOM.03.05/SANDIKAMI/
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                No. Revisi
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                1.1
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                Tanggal Berlaku
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                20 Januari 2022
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            CARD 2: DATA KARYAWAN (Matching Image 2)
        ======================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User size={18} />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Data Karyawan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6">
            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                Nama Karyawan
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {data.nama_karyawan}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                Jabatan
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {data.jabatan?.nama_jabatan || "-"}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                Bidang Penempatan
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {data.bidang?.nama_bidang || "-"}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                Periode Tahun
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {data.tahun}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 block mb-0.5">
                Tanggal Screening
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formatTanggalIndo(data.tanggal_screening)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            CARD 3: HASIL PEMERIKSAAN (Matching Image 2)
        ======================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CheckCircle2 size={18} />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Hasil Pemeriksaan
            </h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-80">Item Pemeriksaan</th>
                  <th className="py-3 px-4 w-28 text-center">Hasil</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {data.details && data.details.length > 0 ? (
                  data.details.map((detail, idx) => (
                    <tr
                      key={detail.id_detail || idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {detail.item?.nama_item || `Item ${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {detail.status === "Ada" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                            Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Tidak
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {detail.keterangan || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Rincian pemeriksaan belum tersedia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================
            CARD 4: KESIMPULAN AKHIR & CATATAN (2-Column Box)
        ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Kesimpulan Akhir */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                KESIMPULAN AKHIR
              </span>
              <span
                className={`text-base font-extrabold mt-0.5 block ${
                  isLengkap
                    ? "text-slate-900 dark:text-white"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {data.kesimpulan}
              </span>
            </div>
          </div>

          {/* Right: Catatan Tambahan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">
              <Info size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Catatan Tambahan
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{data.catatan || "Karyawan memenuhi semua kriteria dokumen yang dipersyaratkan. Dokumen diverifikasi secara internal."}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            BOTTOM CARD: RIWAYAT PERUBAHAN & AUDIT (Matching Image 2)
        ======================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Perubahan Terakhir
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {formatTimestampIndo(data.updated_at || data.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Oleh
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Admin (System)
            </span>
          </div>
        </div>
      </div>
    </ServiceRouteGuard>
  );
}
