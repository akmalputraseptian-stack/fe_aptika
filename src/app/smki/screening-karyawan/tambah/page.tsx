"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  X,
  Info,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import ServiceRouteGuard from "@/components/auth/ServiceRouteGuard";
import {
  getScreeningKaryawanLookup,
  createScreeningKaryawan,
  ScreeningKaryawanLookupData,
} from "@/services/api";

const DEFAULT_ITEMS = [
  { id_item: 1, nama_item: "Data identitas (KTP, NPWP, KK)" },
  { id_item: 2, nama_item: "Tingkat pendidikan (Ijazah & sertifikat)" },
  { id_item: 3, nama_item: "Pemberi referensi" },
  { id_item: 4, nama_item: "Pengalaman kerja sebelumnya" },
  { id_item: 5, nama_item: "Catatan lain yang diperlukan" },
];

export default function TambahScreeningKaryawanPage() {
  const router = useRouter();

  // Master Lookup
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

  // Form Fields
  const [tahun, setTahun] = useState<number>(2026);
  const [namaKaryawan, setNamaKaryawan] = useState<string>("");
  const [idJabatan, setIdJabatan] = useState<string>("");
  const [idBidang, setIdBidang] = useState<string>("");
  const [tanggalScreening, setTanggalScreening] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // 5 Items Checklist State
  const [itemsChecklist, setItemsChecklist] = useState<
    Array<{ id_item: number; status: "Ada" | "Tidak" | ""; keterangan: string }>
  >([
    { id_item: 1, status: "", keterangan: "" },
    { id_item: 2, status: "", keterangan: "" },
    { id_item: 3, status: "", keterangan: "" },
    { id_item: 4, status: "", keterangan: "" },
    { id_item: 5, status: "", keterangan: "" },
  ]);

  const [kesimpulan, setKesimpulan] = useState<string>("");
  const [catatan, setCatatan] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingLookup, setLoadingLookup] = useState<boolean>(true);

  // Fetch Lookup Data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await getScreeningKaryawanLookup();
        if (res?.data) {
          setLookup(res.data);
          if (res.data.items?.length > 0) {
            setItemsChecklist(
              res.data.items.map((it: any) => ({
                id_item: it.id_item,
                status: "",
                keterangan: "",
              }))
            );
          }
        }
      } catch (err) {
        console.error("Gagal memuat master lookup:", err);
      } finally {
        setLoadingLookup(false);
      }
    }
    loadData();
  }, []);

  // Update Checklist row
  const handleStatusChange = (id_item: number, status: "Ada" | "Tidak") => {
    setItemsChecklist((prev) =>
      prev.map((row) => (row.id_item === id_item ? { ...row, status } : row))
    );
  };

  const handleKeteranganChange = (id_item: number, keterangan: string) => {
    setItemsChecklist((prev) =>
      prev.map((row) => (row.id_item === id_item ? { ...row, keterangan } : row))
    );
  };

  // Auto-suggest Kesimpulan based on items
  useEffect(() => {
    const allChecked = itemsChecklist.every((r) => r.status !== "");
    if (allChecked) {
      // If any of items 1-4 is 'Tidak', recommend 'Perlu melengkapi administrasi'
      const essentialMissing = itemsChecklist
        .slice(0, 4)
        .some((r) => r.status === "Tidak");
      if (!kesimpulan) {
        setKesimpulan(
          essentialMissing
            ? "Perlu melengkapi administrasi"
            : "Administrasi Lengkap"
        );
      }
    }
  }, [itemsChecklist]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!namaKaryawan.trim()) {
      toast.error("Nama Karyawan wajib diisi");
      return;
    }
    if (!idJabatan) {
      toast.error("Jabatan wajib dipilih");
      return;
    }
    if (!idBidang) {
      toast.error("Bidang penempatan wajib dipilih");
      return;
    }
    if (!tanggalScreening) {
      toast.error("Tanggal screening wajib diisi");
      return;
    }

    // Check all 5 items status
    const unselected = itemsChecklist.find((it) => it.status === "");
    if (unselected) {
      toast.error("Semua 5 item pemeriksaan harus dipilih statusnya (Ada / Tidak)");
      return;
    }

    if (!kesimpulan) {
      toast.error("Kesimpulan akhir wajib dipilih");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nama_karyawan: namaKaryawan.trim(),
        id_jabatan: Number(idJabatan),
        id_bidang: Number(idBidang),
        tahun: Number(tahun),
        tanggal_screening: tanggalScreening,
        kesimpulan,
        catatan: catatan.trim(),
        details: itemsChecklist.map((it) => ({
          id_item: it.id_item,
          status: it.status as "Ada" | "Tidak",
          keterangan: it.keterangan?.trim() || null,
        })),
      };

      const res = await createScreeningKaryawan(payload);
      if (res?.success) {
        toast.success(res.message || "Data screening berhasil disimpan!");
        router.push("/smki/screening-karyawan");
      }
    } catch (err: any) {
      console.error("Gagal simpan:", err);
      toast.error(
        err?.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan data screening"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const itemNames = lookup.items?.length > 0 ? lookup.items : DEFAULT_ITEMS;

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
            <span>Kembali ke Daftar Screening</span>
          </Link>
        </div>

        {/* Page Title & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Tambah Data Screening Karyawan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Masukkan data baru untuk proses screening karyawan outsourcing.
            </p>
          </div>

          <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Status Baru
          </span>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ========================================================
              SECTION 1: DATA KARYAWAN
          ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-7 h-7 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Data Karyawan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Periode Tahun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Periode Tahun <span className="text-rose-500">*</span>
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {lookup.tahun_options.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Karyawan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Karyawan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap karyawan..."
                  value={namaKaryawan}
                  onChange={(e) => setNamaKaryawan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Jabatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jabatan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={idJabatan}
                  onChange={(e) => setIdJabatan(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Pilih Jabatan</option>
                  {lookup.jabatan.map((j) => (
                    <option key={j.id_jabatan} value={j.id_jabatan}>
                      {j.nama_jabatan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bidang Penempatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bidang Penempatan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={idBidang}
                  onChange={(e) => setIdBidang(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Pilih Bidang</option>
                  {lookup.bidang.map((b) => (
                    <option key={b.id_bidang} value={b.id_bidang}>
                      {b.nama_bidang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Screening */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Screening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggalScreening}
                  onChange={(e) => setTanggalScreening(e.target.value)}
                  className="w-full md:w-1/2 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 2: HASIL PEMERIKSAAN (5 ITEM CHECKLIST)
          ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-7 h-7 rounded-full bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Hasil Pemeriksaan
              </h2>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-72">Item Pemeriksaan</th>
                    <th className="py-3 px-4 w-44">Ada / Tidak</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {itemNames.map((item, idx) => {
                    const row = itemsChecklist.find((r) => r.id_item === item.id_item) || {
                      id_item: item.id_item,
                      status: "",
                      keterangan: "",
                    };

                    return (
                      <tr
                        key={item.id_item}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {item.nama_item}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status_${item.id_item}`}
                                checked={row.status === "Ada"}
                                onChange={() => handleStatusChange(item.id_item, "Ada")}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Ada
                              </span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status_${item.id_item}`}
                                checked={row.status === "Tidak"}
                                onChange={() => handleStatusChange(item.id_item, "Tidak")}
                                className="w-4 h-4 text-rose-600 focus:ring-rose-500 focus:ring-2 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Tidak
                              </span>
                            </label>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Tambah keterangan..."
                            value={row.keterangan}
                            onChange={(e) =>
                              handleKeteranganChange(item.id_item, e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Kesimpulan Akhir */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Kesimpulan <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kesimpulan"
                    value="Perlu melengkapi administrasi"
                    checked={kesimpulan === "Perlu melengkapi administrasi"}
                    onChange={(e) => setKesimpulan(e.target.value)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Perlu melengkapi administrasi
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kesimpulan"
                    value="Administrasi Lengkap"
                    checked={kesimpulan === "Administrasi Lengkap"}
                    onChange={(e) => setKesimpulan(e.target.value)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Administrasi Lengkap
                  </span>
                </label>
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Catatan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Masukkan catatan evaluasi atau instruksi tambahan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Panduan Input Notice Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-slate-600 dark:text-slate-400">
              <Info size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                  Panduan Input
                </h4>
                <p className="text-[11px] leading-relaxed">
                  Lengkapi semua informasi bertanda bintang (*). Untuk item pemeriksaan, pastikan Anda telah memverifikasi dokumen fisik asli sebelum memberikan status.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/smki/screening-karyawan")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={15} />
              <span>Batal</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span>Simpan Data</span>
            </button>
          </div>
        </form>

        <div className="text-center text-[11px] text-slate-400 pt-4">
          ● SISTEM SCREENING KARYAWAN OUTSOURCING — INPUT DATA BARU
        </div>
      </div>
    </ServiceRouteGuard>
  );
}
