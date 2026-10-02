"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Eye,
  FileDown,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import ServiceRouteGuard from "@/components/auth/ServiceRouteGuard";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getScreeningKaryawanList,
  getScreeningKaryawanLookup,
  deleteScreeningKaryawan,
  ScreeningKaryawanItem,
  ScreeningKaryawanStats,
  ScreeningKaryawanLookupData,
} from "@/services/api";
import { exportScreeningKaryawanToPdf } from "@/utils/smkiScreeningKaryawanPdf";

const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = BULAN_PENDEK[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function ScreeningKaryawanListPage() {
  const router = useRouter();
  const { user, bidang } = useAuthStore();

  // State List Data, Pagination, KPI
  const [items, setItems] = useState<ScreeningKaryawanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ScreeningKaryawanStats>({
    total_screening: 24,
    total_karyawan: 18,
    tahun_periode: 2026,
    status_lengkap: 16,
    status_perlu_melengkapi: 8,
  });

  // Master Lookup Options
  const [lookup, setLookup] = useState<ScreeningKaryawanLookupData>({
    jabatan: [],
    bidang: [],
    items: [],
    tahun_options: [2026, 2025, 2024],
    kesimpulan_options: [
      "Perlu melengkapi administrasi",
      "Administrasi Lengkap",
    ],
  });

  // Filter States
  const [search, setSearch] = useState<string>("");
  const [selectedTahun, setSelectedTahun] = useState<string>("ALL");
  const [selectedBidang, setSelectedBidang] = useState<string>("ALL");
  const [selectedKesimpulan, setSelectedKesimpulan] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<ScreeningKaryawanItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load Lookup Data
  useEffect(() => {
    async function fetchLookup() {
      try {
        const res = await getScreeningKaryawanLookup();
        if (res?.data) {
          setLookup(res.data);
        }
      } catch (err) {
        console.error("Gagal memuat opsi lookup:", err);
      }
    }
    fetchLookup();
  }, []);

  // Fetch Screening List
  const fetchList = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        per_page: perPage,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedTahun !== "ALL") params.tahun = selectedTahun;
      if (selectedBidang !== "ALL") params.id_bidang = selectedBidang;
      if (selectedKesimpulan !== "ALL") params.kesimpulan = selectedKesimpulan;

      const res = await getScreeningKaryawanList(params);
      if (res?.success) {
        setItems(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.meta) {
          setCurrentPage(res.meta.current_page || 1);
          setTotalPages(res.meta.last_page || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar screening:", err);
      toast.error(err?.response?.data?.message || "Gagal memuat data screening");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(currentPage);
  }, [currentPage, selectedTahun, selectedBidang, selectedKesimpulan]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchList(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Reset Filter
  const handleResetFilter = () => {
    setSearch("");
    setSelectedTahun("ALL");
    setSelectedBidang("ALL");
    setSelectedKesimpulan("ALL");
    setCurrentPage(1);
  };

  // Confirm Delete
  const handleOpenDelete = (item: ScreeningKaryawanItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteScreeningKaryawan(itemToDelete.id_screening);
      toast.success(res?.message || "Data screening berhasil dihapus");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchList(currentPage);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export First/Selected or Summary PDF
  const handleExportSelected = async (item: ScreeningKaryawanItem) => {
    try {
      toast.loading("Menyiapkan dokumen PDF...", { id: "pdf-export" });
      await exportScreeningKaryawanToPdf(item);
      toast.success("Dokumen Berita Acara berhasil diunduh!", { id: "pdf-export" });
    } catch (err) {
      toast.error("Gagal mengekspor PDF", { id: "pdf-export" });
    }
  };

  return (
    <ServiceRouteGuard requiredService="SMKI">
      <div className="flex flex-col gap-6 pb-12 text-slate-800 dark:text-slate-100">
        {/* ========================================================
            1. WELCOME HERO BANNER (Pixel Match to Mockup)
        ======================================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669] p-6 sm:p-8 text-white shadow-md">
          {/* Subtle curved backdrop decoration */}
          <div className="absolute right-0 bottom-0 w-80 h-full bg-emerald-400/15 rounded-tl-[120px] pointer-events-none" />
          <div className="absolute right-24 -top-8 w-44 h-44 rounded-full bg-teal-300/15 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-emerald-200">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
                Selamat Datang, {user?.name || "Admin"}!
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
                Kelola data, proses screening karyawan outsourcing dengan mudah dan cepat melalui dashboard terintegrasi.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. 4 SUMMARY KPI CARDS (Matching Mockup)
        ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Screening */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                TOTAL SCREENING
              </span>
              <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.total_screening}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 inline-block">
                Data keseluruhan
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText size={20} />
            </div>
          </div>

          {/* Card 2: Karyawan */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                KARYAWAN
              </span>
              <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.total_karyawan}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 inline-block">
                Data karyawan outsourcing
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users size={20} />
            </div>
          </div>

          {/* Card 3: Tahun Periode */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                TAHUN PERIODE
              </span>
              <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.tahun_periode}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 inline-block">
                Periode aktif
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar size={20} />
            </div>
          </div>

          {/* Card 4: Status Lengkap */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                STATUS LENGKAP
              </span>
              <div className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
                {stats.status_lengkap}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 inline-block">
                Administrasi lengkap
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        {/* ========================================================
            3. SECTION HEADER & ACTION BUTTONS
        ======================================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Daftar Screening Karyawan Outsourcing
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola data berita acara screening karyawan outsourcing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleExportSelected(items[0])}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-600/30 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <FileDown size={15} />
                  <span>Export</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push("/smki/screening-karyawan/tambah")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#064e3b] hover:bg-[#047857] shadow-sm transition-colors"
              >
                <Plus size={16} />
                <span>Tambah Screening</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              4. SEARCH & FILTER TOOLBAR
          ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, jabatan, bidang..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Filter Tahun */}
            <div className="md:col-span-2">
              <select
                value={selectedTahun}
                onChange={(e) => {
                  setSelectedTahun(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="ALL">Semua Periode</option>
                {lookup.tahun_options.map((t) => (
                  <option key={t} value={t}>
                    Tahun {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Bidang */}
            <div className="md:col-span-2">
              <select
                value={selectedBidang}
                onChange={(e) => {
                  setSelectedBidang(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="ALL">Semua Bidang</option>
                {lookup.bidang.map((b) => (
                  <option key={b.id_bidang} value={b.id_bidang}>
                    {b.nama_bidang}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kesimpulan */}
            <div className="md:col-span-2">
              <select
                value={selectedKesimpulan}
                onChange={(e) => {
                  setSelectedKesimpulan(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="ALL">Semua Kelengkapan</option>
                <option value="Administrasi Lengkap">Administrasi Lengkap</option>
                <option value="Perlu melengkapi administrasi">Perlu Melengkapi</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="md:col-span-1 flex items-center">
              <button
                type="button"
                onClick={handleResetFilter}
                className="w-full py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Reset Filter"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              5. DATA TABLE
          ======================================================== */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Nama Karyawan</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-4">Bidang Penempatan</th>
                  <th className="py-3 px-4 text-center">Periode</th>
                  <th className="py-3 px-4">Tanggal Screening</th>
                  <th className="py-3 px-4">Kelengkapan</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                      <span>Memuat data screening karyawan...</span>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <AlertCircle size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <span>Tidak ada data screening yang sesuai filter.</span>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const rowNumber = (currentPage - 1) * perPage + idx + 1;
                    const isLengkap = item.kesimpulan === "Administrasi Lengkap";

                    return (
                      <tr
                        key={item.id_screening}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                          {rowNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {item.nama_karyawan}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {item.jabatan?.nama_jabatan || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {item.bidang?.nama_bidang || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300 font-medium">
                          {item.tahun}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {formatShortDate(item.tanggal_screening)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isLengkap ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                              Administrasi Lengkap
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800">
                              Perlu Melengkapi
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5 text-slate-400">
                            {/* View Detail Button */}
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/smki/screening-karyawan/${item.id_screening}`)
                              }
                              title="Lihat Detail"
                              className="p-1.5 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            >
                              <Eye size={16} />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/smki/screening-karyawan/${item.id_screening}/edit`)
                              }
                              title="Edit Data"
                              className="p-1.5 rounded-lg hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <Pencil size={16} />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item)}
                              title="Hapus Data"
                              className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================
              6. PAGINATION FOOTER
          ======================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500">
            <div>
              Showing {items.length > 0 ? (currentPage - 1) * perPage + 1 : 0} to{" "}
              {Math.min(currentPage * perPage, totalCount)} of {totalCount} entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                    currentPage === pageNum
                      ? "bg-[#064e3b] text-white"
                      : "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <span>© 2026 SISTEM SCREENING KARYAWAN OUTSOURCING</span>
          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
          </div>
        </div>

        {/* ========================================================
            7. MODAL KONFIRMASI HAPUS (Exact Match to Image 1)
        ======================================================== */}
        {deleteModalOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 text-center shadow-xl border border-slate-200 dark:border-slate-800">
              {/* Red Exclamation Warning Icon */}
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center text-rose-500 mx-auto mb-4">
                <AlertCircle size={32} />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Hapus Data Screening?
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Data screening karyawan atas nama{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {itemToDelete.nama_karyawan}
                </strong>{" "}
                akan dihapus dari sistem. Apakah Anda yakin ingin melanjutkan?
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isDeleting && <Loader2 size={14} className="animate-spin" />}
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ServiceRouteGuard>
  );
}
