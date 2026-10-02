"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Save,
  X,
  Info,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ServiceRouteGuard from "@/components/auth/ServiceRouteGuard";
import {
  getScreeningKaryawanDetail,
  getScreeningKaryawanLookup,
  updateScreeningKaryawan,
  ScreeningKaryawanItem,
  ScreeningKaryawanLookupData,
} from "@/services/api";

const DEFAULT_ITEMS = [
  { id_item: 1, nama_item: "Data identitas (KTP, NPWP, KK)" },
  { id_item: 2, nama_item: "Tingkat pendidikan (Ijazah & sertifikat)" },
  { id_item: 3, nama_item: "Pemberi referensi" },
  { id_item: 4, nama_item: "Pengalaman kerja sebelumnya" },
  { id_item: 5, nama_item: "Catatan lain yang diperlukan" },
];

export default function EditScreeningKaryawanPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

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

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [tahun, setTahun] = useState<number>(2026);
  const [namaKaryawan, setNamaKaryawan] = useState<string>("");
  const [idJabatan, setIdJabatan] = useState<string>("");
  const [idBidang, setIdBidang] = useState<string>("");
  const [tanggalScreening, setTanggalScreening] = useState<string>("");
  const [kesimpulan, setKesimpulan] = useState<string>("Administrasi Lengkap");
  const [catatan, setCatatan] = useState<string>("");

  // 5 Checklist items
  const [itemsChecklist, setItemsChecklist] = useState<
    Array<{ id_item: number; status: "Ada" | "Tidak"; keterangan: string }>
  >([
    { id_item: 1, status: "Ada", keterangan: "" },
    { id_item: 2, status: "Ada", keterangan: "" },
    { id_item: 3, status: "Ada", keterangan: "" },
    { id_item: 4, status: "Ada", keterangan: "" },
    { id_item: 5, status: "Tidak", keterangan: "" },
  ]);

  // Load Initial Data & Lookup
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [lookupRes, detailRes] = await Promise.all([
          getScreeningKaryawanLookup(),
          getScreeningKaryawanDetail(id),
        ]);

        if (lookupRes?.data) {
          setLookup(lookupRes.data);
        }

        if (detailRes?.data) {
          const d: ScreeningKaryawanItem = detailRes.data;
          setNamaKaryawan(d.nama_karyawan);
          setIdJabatan(String(d.id_jabatan));
          setIdBidang(String(d.id_bidang));
          setTahun(d.tahun || 2026);
          setTanggalScreening(
            d.tanggal_screening ? d.tanggal_screening.split("T")[0] : ""
          );
          setKesimpulan(d.kesimpulan);
          setCatatan(d.catatan || "");

          if (d.details && d.details.length > 0) {
            setItemsChecklist(
              d.details.map((dt) => ({
                id_item: dt.id_item,
                status: (dt.status as "Ada" | "Tidak") || "Ada",
                keterangan: dt.keterangan || "",
              }))
            );
          }
        }
      } catch (err: any) {
        console.error("Gagal memuat detail screening:", err);
        toast.error("Gagal memuat data screening karyawan");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      init();
    }
  }, [id]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
          status: it.status,
          keterangan: it.keterangan?.trim() || null,
        })),
      };

      const res = await updateScreeningKaryawan(id, payload);
      if (res?.success) {
        toast.success(res.message || "Data screening berhasil diperbarui!");
        router.push(`/smki/screening-karyawan/${id}`);
      }
    } catch (err: any) {
      console.error("Gagal update:", err);
      toast.error(
        err?.response?.data?.message || "Terjadi kesalahan saat memperbarui data"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const itemNames = lookup.items?.length > 0 ? lookup.items : DEFAULT_ITEMS;

  if (loading) {
    return (
      <ServiceRouteGuard requiredService="SMKI">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
          <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
          <span>Memuat data screening...</span>
        </div>
      </ServiceRouteGuard>
    );
  }

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

        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Edit Data Screening Karyawan Outsourcing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Perbarui informasi hasil pemeriksaan dan data karyawan yang telah masuk dalam sistem.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ========================================================
              CARD 1: INFORMASI KARYAWAN (Image 4)
          ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Info size={18} />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Informasi Karyawan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Periode Tahun */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Periode Tahun <span className="text-rose-500">*</span>
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                  value={namaKaryawan}
                  onChange={(e) => setNamaKaryawan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Pilih Bidang</option>
                  {lookup.bidang.map((b) => (
                    <option key={b.id_bidang} value={b.id_bidang}>
                      {b.nama_bidang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Tanggal Screening */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Screening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggalScreening}
                  onChange={(e) => setTanggalScreening(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Kesimpulan Utama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kesimpulan Utama <span className="text-rose-500">*</span>
                </label>
                <select
                  value={kesimpulan}
                  onChange={(e) => setKesimpulan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="Administrasi Lengkap">Administrasi Lengkap</option>
                  <option value="Perlu melengkapi administrasi">
                    Perlu melengkapi administrasi
                  </option>
                </select>
              </div>

              {/* Catatan Tambahan Quick Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Ringkas
                </label>
                <input
                  type="text"
                  placeholder="Catatan status..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 2: HASIL PEMERIKSAAN DOKUMEN (Image 4)
          ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CheckCircle2 size={18} />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Hasil Pemeriksaan Dokumen
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-72">Item Pemeriksaan</th>
                    <th className="py-3 px-4 w-44">Status Ada/Tidak</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {itemNames.map((item, idx) => {
                    const row = itemsChecklist.find((r) => r.id_item === item.id_item) || {
                      id_item: item.id_item,
                      status: "Ada" as const,
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
                                name={`edit_status_${item.id_item}`}
                                checked={row.status === "Ada"}
                                onChange={() => handleStatusChange(item.id_item, "Ada")}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Ada
                              </span>
                            </label>

                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`edit_status_${item.id_item}`}
                                checked={row.status === "Tidak"}
                                onChange={() => handleStatusChange(item.id_item, "Tidak")}
                                className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
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
                            placeholder="Keterangan dokumen..."
                            value={row.keterangan}
                            onChange={(e) =>
                              handleKeteranganChange(item.id_item, e.target.value)
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================
              CARD 3: ANALISIS AKHIR & REKOMENDASI (Image 4)
          ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Analisis Akhir & Rekomendasi
            </h3>
            <textarea
              rows={4}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Karyawan atas nama ... menunjukkan kualifikasi yang sangat baik. Dokumen identitas dan riwayat kerja telah dikonfirmasi valid oleh tim internal. Direkomendasikan untuk melanjutkan ke tahap onboarding operasional."
              className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/smki/screening-karyawan/${id}`)}
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
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </ServiceRouteGuard>
  );
}
