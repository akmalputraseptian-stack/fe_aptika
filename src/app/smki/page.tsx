"use client";

import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Clock,
  Laptop,
  ArrowRight,
  FileText,
  CalendarCheck,
  Users,
} from "lucide-react";
import ServiceRouteGuard from "@/components/auth/ServiceRouteGuard";
import { useAuthStore } from "@/store/useAuthStore";

export default function SmkiPage() {
  const router = useRouter();
  const { user, bidang, isAdminAptika } = useAuthStore();

  return (
    <ServiceRouteGuard requiredService="SMKI">
      <div className="flex flex-col gap-6 pb-12">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
          <div className="absolute right-36 -top-12 w-48 h-48 rounded-full bg-teal-300/15 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                SMKI Diskominfo Jawa Barat
              </h1>
              <p className="text-sm text-emerald-100 leading-relaxed">
                Pusat tata kelola, inventarisasi software resmi, kepatuhan lisensi, dan penerbitan dokumen standardisasi keamanan informasi di lingkungan Pemerintah Provinsi Jawa Barat.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 flex-shrink-0">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs font-semibold">
                <Building2 size={16} className="text-emerald-300" />
                <span>Bidang: <strong className="text-white">{bidang?.name || "Semua Bidang"}</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs font-semibold">
                <Clock size={16} className="text-emerald-200" />
                <span>Status Layanan: <strong className="text-emerald-100">Aktif &amp; Beroperasi</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card: Manajemen Software Standar */}
          <div
            onClick={() => router.push("/smki/software-standar")}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Manajemen Software Standar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                Kelola inventaris perangkat lunak resmi, audit lisensi, serta otomatis ekspor formulir input ke dalam template dokumen resmi FR-017.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Layanan</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Card: Daftar Aset TI */}
          <div
            onClick={() => router.push("/daftar-aset-ti")}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Daftar Aset TI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                Sistem inventarisasi &amp; manajemen aset perangkat keras, monitoring masa pakai, pemantauan dukungan serta ekspor laporan Excel Bidang APTIKA.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start text-xs font-bold text-blue-600 dark:text-blue-400">
              <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Layanan</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Card: Berita Acara Penghancuran Media */}
          <div
            onClick={() => router.push("/smki/berita-acara")}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Berita Acara Penghancuran Media
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                Kelola data berita acara penghancuran media sesuai formulir FR014-SMKI, rincian perangkat, serta ekspor dokumen resmi Word (.docx).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Layanan</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Card: Formulir Rencana Audit (F05-SMKI) */}
          <div
            onClick={() => router.push("/smki/rencana-audit")}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                <CalendarCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Formulir Rencana Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                Jadwalkan dan kelola rencana audit internal SMKI (F05-SMKI), kontrol ISO 27001, auditee, auditor, serta ekspor dokumen resmi PDF.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start text-xs font-bold text-teal-600 dark:text-teal-400">
              <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Layanan</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Card: Berita Acara Screening Karyawan Outsourcing */}
          <div
            onClick={() => router.push("/smki/screening-karyawan")}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Screening Karyawan Outsourcing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                Kelola berita acara verifikasi administrasi tenaga alih daya, 5 item checklist kepatuhan, serta cetak dokumen resmi format FR-012/KOM.03.05/SANDIKAMI.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-start text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Buka Layanan</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </ServiceRouteGuard>
  );
}
