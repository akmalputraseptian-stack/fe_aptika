"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  FileDown,
  Pencil,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  Building2,
  MapPin,
  X,
  Loader2,
  FileText,
  Printer,
  ShieldCheck,
  Info,
  Check,
  RotateCcw,
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
} from "lucide-react";
import toast from "react-hot-toast";
import ServiceRouteGuard from "@/components/auth/ServiceRouteGuard";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getRencanaAuditList,
  getRencanaAuditLookup,
  createRencanaAudit,
  updateRencanaAudit,
  deleteRencanaAudit,
  DetailAuditItem,
  RencanaAuditStats,
  RencanaAuditLookupData,
  RencanaAuditPayload,
} from "@/services/api";
import {
  exportRencanaAuditToPdf,
  formatTanggalIndo,
  formatTanggalSingkat,
} from "@/utils/smkiRencanaAuditPdf";

export default function FormulirRencanaAuditPage() {
  const router = useRouter();
  const { user, bidang } = useAuthStore();

  // State List Data & KPI Stats
  const [items, setItems] = useState<DetailAuditItem[]>([]);
  const [stats, setStats] = useState<RencanaAuditStats>({
    total_terjadwal: 8,
    dalam_proses: 3,
    butuh_perhatian: 1,
    selesai: 0,
    total_aktif: 12,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topSearch, setTopSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 2,
    per_page: 10,
    total: 12,
  });

  // State Master Lookup
  const [lookups, setLookups] = useState<RencanaAuditLookupData>({
    auditors: [],
    bidang_auditee: [],
    lokasi_auditee: [],
    standard_clauses: [],
    default_meta: {
      no_dokumen: "F05-SMKI-APTIKA",
      no_revisi: "1.0",
      tanggal_berlaku: "20 Mei 2024",
    },
  });

  // Filter dropdown state
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterAuditorId, setFilterAuditorId] = useState<string>("ALL");
  const [filterBidangId, setFilterBidangId] = useState<string>("ALL");

  // Modal State: Create / Add
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Form Fields - Create
  const [createKontrol, setCreateKontrol] = useState("");
  const [createBidangId, setCreateBidangId] = useState("");
  const [createBidangCustom, setCreateBidangCustom] = useState("");
  const [createLokasiText, setCreateLokasiText] = useState("");
  const [createTanggal, setCreateTanggal] = useState("2024-05-20");
  const [createAuditorId, setCreateAuditorId] = useState("");
  const [createAuditorCustom, setCreateAuditorCustom] = useState("");
  const [createKodeProsedur, setCreateKodeProsedur] = useState("");
  const [createCatatan, setCreateCatatan] = useState("");

  // Modal State: Edit (with dark header matching Visily Mockup Page 1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DetailAuditItem | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [isEditManualClause, setIsEditManualClause] = useState(false);

  // Form Fields - Edit
  const [editKontrol, setEditKontrol] = useState("");
  const [editBidangId, setEditBidangId] = useState("");
  const [editBidangCustom, setEditBidangCustom] = useState("");
  const [editLokasiText, setEditLokasiText] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [editAuditorId, setEditAuditorId] = useState("");
  const [editAuditorCustom, setEditAuditorCustom] = useState("");
  const [editKodeProsedur, setEditKodeProsedur] = useState("");
  const [editStatus, setEditStatus] = useState<"SCHEDULED" | "IN PROGRESS" | "PENDING" | "COMPLETED">("SCHEDULED");
  const [editCatatan, setEditCatatan] = useState("");

  // Modal State: Delete Confirmation (Matching Visily Mockup Page 3)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DetailAuditItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Modal State: Export PDF
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfLeadAuditor, setPdfLeadAuditor] = useState("Heri Susanto, M.Kom");
  const [pdfLeadAuditorNip, setPdfLeadAuditorNip] = useState("19820415 200801 1 005");
  const [pdfApprover, setPdfApprover] = useState("Mas Adi Komar, S.STP., M.Tr.A.P");
  const [pdfApproverNip, setPdfApproverNip] = useState("19800512 200012 1 001");

  // Fetch Lookups
  const fetchLookups = async () => {
    try {
      const res = await getRencanaAuditLookup();
      if (res?.success) {
        setLookups(res.data);
        if (res.data.auditors && res.data.auditors.length > 0) {
          setPdfLeadAuditor(res.data.auditors[0].nama_auditor);
          setPdfLeadAuditorNip(res.data.auditors[0].nip_auditor || "-");
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data lookup:", err);
    }
  };

  // Fetch Audit Plans
  const fetchAuditPlans = async () => {
    setLoading(true);
    try {
      const effectiveSearch = search || topSearch || undefined;
      const params: any = {
        search: effectiveSearch,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        id_auditor: filterAuditorId !== "ALL" ? Number(filterAuditorId) : undefined,
        id_bidang_auditee: filterBidangId !== "ALL" ? Number(filterBidangId) : undefined,
        page,
        per_page: 10,
      };

      const res = await getRencanaAuditList(params);
      if (res?.success) {
        setItems(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err) {
      console.error("Gagal memuat rencana audit:", err);
      toast.error("Gagal memuat data formulir rencana audit.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchAuditPlans();
  }, [page, search, topSearch, statusFilter, filterAuditorId, filterBidangId]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateKontrol("");
    const defaultBidang = lookups.bidang_auditee.find((b) => b.bidang_auditee.includes("Penyelenggaraan")) || lookups.bidang_auditee[0];
    setCreateBidangId(defaultBidang ? String(defaultBidang.id_bidang_auditee) : "");
    setCreateBidangCustom("");
    setCreateLokasiText("Gedung A, Lantai 3, Ruang Rapat");
    setCreateTanggal("2024-05-20");
    setCreateAuditorId("");
    setCreateAuditorCustom("");
    setCreateKodeProsedur("");
    setCreateCatatan("");
    setIsCreateModalOpen(true);
  };

  // Save Create Form
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createKontrol.trim()) {
      toast.error("Persyaratan / Kontrol / Prosedur SMKI wajib diisi!");
      return;
    }
    if (!createBidangId && !createBidangCustom.trim()) {
      toast.error("Bidang Auditee wajib dipilih!");
      return;
    }
    if (!createLokasiText.trim()) {
      toast.error("Lokasi Auditee wajib diisi!");
      return;
    }
    if (!createTanggal) {
      toast.error("Tanggal audit wajib ditentukan!");
      return;
    }
    if (!createAuditorId && !createAuditorCustom.trim()) {
      toast.error("Auditor wajib dipilih!");
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload: RencanaAuditPayload = {
        kontrol_SMKI: createKontrol.trim(),
        tanggal_audit: createTanggal,
        id_auditor: createAuditorId ? Number(createAuditorId) : undefined,
        nama_auditor: createAuditorCustom.trim() || undefined,
        id_bidang_auditee: createBidangId ? Number(createBidangId) : undefined,
        bidang_auditee: createBidangCustom.trim() || undefined,
        lokasi_auditee: createLokasiText.trim(),
        kode_prosedur: createKodeProsedur.trim() || undefined,
        status: "SCHEDULED",
        catatan: createCatatan.trim() || undefined,
      };

      const res = await createRencanaAudit(payload);
      if (res?.success) {
        toast.success("Rencana Audit berhasil disimpan!");
        setIsCreateModalOpen(false);
        fetchAuditPlans();
        fetchLookups();
      } else {
        toast.error(res?.message || "Gagal menyimpan data.");
      }
    } catch (err: any) {
      console.error("Gagal simpan data:", err);
      toast.error(err?.response?.data?.message || "Terjadi kesalahan saat menyimpan rencana audit.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Edit Modal (Mockup Page 1)
  const handleOpenEditModal = (item: DetailAuditItem) => {
    setEditingItem(item);
    setEditKontrol(item.kontrol_SMKI || "");
    setEditBidangId(item.auditee?.id_bidang_auditee ? String(item.auditee.id_bidang_auditee) : "");
    setEditBidangCustom(item.bidang_nama || "");
    setEditLokasiText(item.lokasi_nama || "Ruang Server Gedung B Diskominfo");
    setEditTanggal(item.tanggal_audit ? item.tanggal_audit.substring(0, 10) : "2026-10-25");
    setEditAuditorId(item.id_auditor ? String(item.id_auditor) : "");
    setEditAuditorCustom(item.auditor_nama || "");
    setEditKodeProsedur(item.kode_prosedur || "");
    setEditStatus(item.status || "SCHEDULED");
    setEditCatatan(item.catatan || "");
    setIsEditManualClause(false);
    setIsEditModalOpen(true);
  };

  // Save Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editKontrol.trim()) {
      toast.error("Persyaratan / Kontrol / Prosedur SMKI wajib diisi!");
      return;
    }
    if (!editTanggal) {
      toast.error("Tanggal audit wajib ditentukan!");
      return;
    }

    setEditSubmitting(true);
    try {
      const payload: Partial<RencanaAuditPayload> = {
        kontrol_SMKI: editKontrol.trim(),
        tanggal_audit: editTanggal,
        id_auditor: editAuditorId ? Number(editAuditorId) : undefined,
        nama_auditor: editAuditorCustom.trim() || undefined,
        id_bidang_auditee: editBidangId ? Number(editBidangId) : undefined,
        bidang_auditee: editBidangCustom.trim() || undefined,
        lokasi_auditee: editLokasiText.trim(),
        kode_prosedur: editKodeProsedur.trim() || undefined,
        status: editStatus,
        catatan: editCatatan.trim() || undefined,
      };

      const res = await updateRencanaAudit(editingItem.id_detail_audit, payload);
      if (res?.success) {
        toast.success("Perubahan rencana audit berhasil disimpan!");
        setIsEditModalOpen(false);
        setEditingItem(null);
        fetchAuditPlans();
      } else {
        toast.error(res?.message || "Gagal memperbarui rencana audit.");
      }
    } catch (err: any) {
      console.error("Gagal update data:", err);
      toast.error(err?.response?.data?.message || "Gagal memperbarui data.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Delete Modal (Mockup Page 3)
  const handleOpenDeleteModal = (item: DetailAuditItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteSubmitting(true);
    try {
      const res = await deleteRencanaAudit(itemToDelete.id_detail_audit);
      if (res?.success) {
        toast.success("Data berhasil dihapus.");
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        fetchAuditPlans();
      } else {
        toast.error(res?.message || "Gagal menghapus data.");
      }
    } catch (err: any) {
      console.error("Gagal menghapus data:", err);
      toast.error(err?.response?.data?.message || "Terjadi kesalahan saat menghapus data.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Trigger Export PDF
  const handleExportPdf = async () => {
    if (items.length === 0) {
      toast.error("Tidak ada data rencana audit untuk diekspor!");
      return;
    }

    setIsExportingPdf(true);
    try {
      await exportRencanaAuditToPdf({
        items,
        metadata: lookups.default_meta,
        leadAuditorName: pdfLeadAuditor,
        leadAuditorNip: pdfLeadAuditorNip,
        approvedByName: pdfApprover,
        approvedByNip: pdfApproverNip,
        tanggalDokumen: new Date().toISOString(),
      });
      toast.success("Dokumen PDF Formulir Rencana Audit berhasil diunduh!");
      setIsExportModalOpen(false);
    } catch (err) {
      console.error("Gagal ekspor PDF:", err);
      toast.error("Gagal menghasilkan dokumen PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Render Status Badge matching Visily
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#15803d]">
            COMPLETED
          </span>
        );
      case "IN PROGRESS":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#16a34a]">
            IN PROGRESS
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffedd5] text-[#ea580c]">
            PENDING
          </span>
        );
      case "SCHEDULED":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#dbeafe] text-[#2563eb]">
            SCHEDULED
          </span>
        );
    }
  };

  return (
    <ServiceRouteGuard requiredService="SMKI">
      <div className="flex flex-col gap-5 pb-16 max-w-7xl mx-auto px-2 sm:px-4 font-sans text-slate-800">
        
        {/* ============================================================ */}
        {/* 1. TOP BREADCRUMB & HEADER NAV BAR (Matching Visily Mockup)  */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 py-1">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
              <Home size={14} className="text-slate-400" />
              <span>Beranda</span>
            </Link>
            <span className="text-slate-300">&gt;</span>
            <Link href="/dashboard" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
              <LayoutDashboard size={14} className="text-slate-400" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">&gt;</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <FileText size={14} className="text-slate-600" />
              <span>Formulir Rencana Audit</span>
            </span>
          </div>

          {/* Right: Search, Notification Bell, User Pill */}
          <div className="flex items-center gap-4">
            {/* Top Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                placeholder="Cari rencana audit..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56 text-slate-700"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative cursor-pointer text-slate-500 hover:text-slate-700">
              <Bell size={17} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                FP
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-800 text-[11px] leading-tight">
                  {user?.name || "feni pebriani"}
                </span>
                <span className="text-[10px] text-slate-400">
                  APTIKA Intern
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 ml-0.5" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. HERO BANNER WITH SIGNATURE EMERALD GRADIENT               */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
          <div className="absolute right-36 -top-12 w-48 h-48 rounded-full bg-teal-300/15 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
                <CalendarCheck size={26} />
              </div>
              <div className="max-w-2xl">
                {/* Pill Tag */}
                <div className="mb-2">
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/15 backdrop-blur-md text-emerald-100 border border-white/20">
                    SISTEM MANAJEMEN KEAMANAN INFORMASI
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
                  Formulir Rencana Audit (F05-SMKI)
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal max-w-xl">
                  Halaman ini digunakan untuk merencanakan dan menjadwalkan kegiatan audit internal SMKI di lingkungan Aptika. Pastikan semua persyaratan kontrol telah sesuai dengan standar ISO 27001.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs font-semibold text-emerald-50 shadow-sm">
                <Building2 size={16} className="text-emerald-300" />
                <span>Unit Kerja: <strong className="text-white font-bold">{bidang?.name || "Bidang Aplikasi Informatika"}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. THREE METADATA CARDS (Matching Visily Page 4)             */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Box 1: NO. DOKUMEN */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                NO. DOKUMEN
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {lookups.default_meta.no_dokumen}
              </p>
            </div>
          </div>

          {/* Box 2: NO. REVISI */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#f0fdfa] text-[#0d9488] flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                NO. REVISI
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {lookups.default_meta.no_revisi}
              </p>
            </div>
          </div>

          {/* Box 3: TANGGAL BERLAKU */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TANGGAL BERLAKU
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {lookups.default_meta.tanggal_berlaku}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. TABLE SECTION CONTAINER WITH TOOLBAR                      */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          
          {/* Toolbar (Matching Visily Page 4) */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari prosedur atau auditee..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    isFilterDropdownOpen || filterAuditorId !== "ALL" || statusFilter !== "ALL"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Filter size={14} className="text-slate-500" />
                  <span>Filter</span>
                </button>

                {/* Filter Popup Menu */}
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 p-3.5 bg-white rounded-xl shadow-lg border border-slate-200 z-30 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">Filter Rencana Audit</span>
                      <button onClick={() => setIsFilterDropdownOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={13} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(1);
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Auditor</label>
                      <select
                        value={filterAuditorId}
                        onChange={(e) => {
                          setFilterAuditorId(e.target.value);
                          setPage(1);
                        }}
                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                      >
                        <option value="ALL">Semua Auditor</option>
                        {lookups.auditors.map((a) => (
                          <option key={a.id_auditor} value={a.id_auditor}>
                            {a.nama_auditor}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter("ALL");
                          setFilterAuditorId("ALL");
                          setIsFilterDropdownOpen(false);
                        }}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ekspor Button */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              >
                <FileDown size={14} className="text-slate-500" />
                <span>Ekspor</span>
              </button>

              {/* + Tambah Rencana Audit Button */}
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white shadow-2xs transition-colors"
              >
                <Plus size={15} />
                <span>+ Tambah Rencana Audit</span>
              </button>
            </div>
          </div>

          {/* Table Data (Matching Visily Page 4) */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 size={28} className="animate-spin text-[#059669]" />
                <p className="text-xs">Memuat rencana audit...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Tidak ada data rencana audit yang ditemukan.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-800 font-bold bg-white">
                    <th className="py-3 px-4 w-12 text-center font-bold">No</th>
                    <th className="py-3 px-4 min-w-[280px]">Persyaratan / Kontrol / Prosedur SMKI</th>
                    <th className="py-3 px-4 min-w-[240px]">Auditee (Bidang &amp; Lokasi)</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tanggal Audit</th>
                    <th className="py-3 px-4 min-w-[170px]">Auditor</th>
                    <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const rowNumber = (page - 1) * meta.per_page + (idx + 1);
                    return (
                      <tr key={item.id_detail_audit} className="hover:bg-slate-50/60 transition-colors">
                        {/* No */}
                        <td className="py-4 px-4 text-center text-slate-500 font-normal">
                          {rowNumber}
                        </td>

                        {/* Persyaratan / Kontrol / Prosedur SMKI */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-slate-900 leading-snug">
                              {item.kontrol_SMKI}
                            </span>
                            <div className="flex items-center gap-2">
                              {renderStatusBadge(item.status)}
                              {item.kode_prosedur && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                                  <FileText size={11} className="text-slate-400" />
                                  <span>{item.kode_prosedur}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Auditee (Bidang & Lokasi) */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {item.bidang_nama}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              {item.lokasi_nama}
                            </span>
                          </div>
                        </td>

                        {/* Tanggal Audit */}
                        <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-800">
                          {formatTanggalSingkat(item.tanggal_audit)}
                        </td>

                        {/* Auditor */}
                        <td className="py-4 px-4">
                          <span className="font-medium text-slate-800">
                            {item.auditor_nama}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-2.5 text-slate-400">
                            {/* Edit Pencil Icon */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Data"
                              className="hover:text-slate-700 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>

                            {/* Delete Trash Icon */}
                            <button
                              onClick={() => handleOpenDeleteModal(item)}
                              title="Hapus Data"
                              className="hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>

                            {/* More Options */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Lainnya"
                              className="hover:text-slate-700 transition-colors"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Footer & Pagination (Matching Visily Page 4) */}
          <div className="py-3 px-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <strong className="text-slate-700">{items.length}</strong> dari <strong className="text-slate-700">{meta.total}</strong> rencana audit aktif
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                Sebelumnya
              </button>

              <button
                onClick={() => setPage(1)}
                className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                  page === 1
                    ? "bg-[#059669] text-white"
                    : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                1
              </button>

              <button
                onClick={() => setPage(2)}
                className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                  page === 2
                    ? "bg-[#059669] text-white"
                    : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                2
              </button>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, meta.last_page))}
                disabled={page >= meta.last_page}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. DASHBOARD SUMMARY STATS CARDS (Below Table in Mockup)     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: TOTAL AUDIT TERJADWAL */}
          <div
            onClick={() => setStatusFilter("SCHEDULED")}
            className="cursor-pointer bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#065f46] uppercase tracking-wider mb-2">
              <span>TOTAL AUDIT TERJADWAL</span>
              <span className="text-[11px] text-[#059669] font-normal normal-case">
                +2 dari bulan lalu
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#065f46]">
              {String(stats.total_terjadwal).padStart(2, "0")}
            </div>
          </div>

          {/* Card 2: DALAM PROSES */}
          <div
            onClick={() => setStatusFilter("IN PROGRESS")}
            className="cursor-pointer bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#1e40af] uppercase tracking-wider mb-2">
              <span>DALAM PROSES</span>
              <span className="text-[11px] text-[#2563eb] font-normal normal-case">
                Berjalan sesuai jadwal
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#1e40af]">
              {String(stats.dalam_proses).padStart(2, "0")}
            </div>
          </div>

          {/* Card 3: BUTUH PERHATIAN */}
          <div
            onClick={() => setStatusFilter("PENDING")}
            className="cursor-pointer bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#b45309] uppercase tracking-wider mb-2">
              <span>BUTUH PERHATIAN</span>
              <span className="text-[11px] text-[#d97706] font-normal normal-case">
                Menunggu konfirmasi auditee
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#b45309]">
              {String(stats.butuh_perhatian).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 6. MODAL: TAMBAH DATA (Matching Visily Mockup Page 2)        */}
        {/* ============================================================ */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="flex items-start justify-between p-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Tambah Data Rencana Audit
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lengkapi formulir di bawah untuk membuat jadwal audit baru.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveCreate} className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Informasi Kepatuhan Callout */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]">
                  <Info size={15} className="text-[#059669] mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="block font-bold text-xs">Informasi Kepatuhan</strong>
                    <span className="text-[11px] text-[#047857] leading-relaxed">
                      Pastikan klausul SMKI yang dipilih sesuai dengan ruang lingkup sertifikasi instansi terkait.
                    </span>
                  </div>
                </div>

                {/* PERSYARATAN / KONTROL / PROSEDUR SMKI */}
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                    PERSYARATAN / KONTROL / PROSEDUR SMKI <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={createKontrol}
                    onChange={(e) => setCreateKontrol(e.target.value)}
                    placeholder="Contoh: A.5 Kendali Organisasi, ISO 27001:2022 Klausul 5.1..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Sebutkan klausul standar ISO atau kontrol internal yang akan diaudit.
                  </p>
                </div>

                {/* BIDANG AUDITEE & LOKASI AUDITEE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      BIDANG AUDITEE <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createBidangId}
                      onChange={(e) => setCreateBidangId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Pilih Bidang Auditee</option>
                      {lookups.bidang_auditee.map((b) => (
                        <option key={b.id_bidang_auditee} value={b.id_bidang_auditee}>
                          {b.bidang_auditee}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      LOKASI AUDITEE <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={createLokasiText}
                        onChange={(e) => setCreateLokasiText(e.target.value)}
                        placeholder="Gedung A, Lantai 3, Ruang Rapat"
                        className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TANGGAL AUDIT & AUDITOR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      TANGGAL AUDIT <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={createTanggal}
                        onChange={(e) => setCreateTanggal(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      AUDITOR <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createAuditorId}
                      onChange={(e) => setCreateAuditorId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Pilih Auditor Internal</option>
                      {lookups.auditors.map((a) => (
                        <option key={a.id_auditor} value={a.id_auditor}>
                          {a.nama_auditor}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* OPSIONAL: Catatan Tambahan */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 uppercase">
                      OPSIONAL
                    </span>
                    <label className="font-semibold text-slate-700 text-xs">Catatan Tambahan</label>
                  </div>
                  <textarea
                    rows={2}
                    value={createCatatan}
                    onChange={(e) => setCreateCatatan(e.target.value)}
                    placeholder="Misal: Kebutuhan akses remote server, wawancara admin..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[#059669] hover:bg-[#047857] text-white shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {createSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={13} />
                        <span>Simpan Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 7. MODAL: EDIT DATA (Matching Visily Mockup Page 1 Dark Head)*/}
        {/* ============================================================ */}
        {isEditModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Dark Header (Matching Visily Mockup Page 1) */}
              <div className="bg-[#111827] text-white p-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#064e3b] text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      Edit Data Rencana Audit
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mt-0.5">
                      {editingItem.kode_prosedur || "A.5.1"} {editingItem.kontrol_SMKI.split("-")[0]?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* Info Callout */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]">
                  <Info size={15} className="text-[#059669] mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-[#047857] leading-relaxed">
                    Anda sedang mengubah jadwal audit untuk Klausul {editingItem.kontrol_SMKI.split("-")[0] || "A.5.1"}. Pastikan ketersediaan waktu auditee sebelum menyimpan perubahan.
                  </span>
                </div>

                {/* PERSYARATAN / KONTROL / PROSEDUR SMKI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                      PERSYARATAN / KONTROL / PROSEDUR SMKI <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditManualClause(!isEditManualClause)}
                      className="text-[10px] font-bold text-[#059669] hover:underline uppercase"
                    >
                      {isEditManualClause ? "PILIH DAFTAR" : "+ PILIH BARU"}
                    </button>
                  </div>

                  {isEditManualClause ? (
                    <textarea
                      rows={2}
                      value={editKontrol}
                      onChange={(e) => setEditKontrol(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <select
                      value={editKontrol}
                      onChange={(e) => setEditKontrol(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value={editKontrol}>{editKontrol}</option>
                      {lookups.standard_clauses
                        .filter((sc) => sc !== editKontrol)
                        .map((sc, i) => (
                          <option key={i} value={sc}>
                            {sc}
                          </option>
                        ))}
                    </select>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Pilih standar ISO 27001 atau kebijakan internal yang akan dievaluasi dalam audit ini.
                  </p>
                </div>

                {/* BIDANG AUDITEE & LOKASI AUDITEE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      BIDANG AUDITEE <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editBidangId}
                      onChange={(e) => setEditBidangId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {lookups.bidang_auditee.map((b) => (
                        <option key={b.id_bidang_auditee} value={b.id_bidang_auditee}>
                          {b.bidang_auditee}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      LOKASI AUDITEE <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={editLokasiText}
                        onChange={(e) => setEditLokasiText(e.target.value)}
                        placeholder="Ruang Server Gedung B Diskominfo"
                        className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TANGGAL AUDIT & AUDITOR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      TANGGAL AUDIT <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={editTanggal}
                        onChange={(e) => setEditTanggal(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                      AUDITOR <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editAuditorId}
                      onChange={(e) => setEditAuditorId(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {lookups.auditors.map((a) => (
                        <option key={a.id_auditor} value={a.id_auditor}>
                          {a.nama_auditor}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">
                    STATUS AUDIT
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-semibold"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="PENDING">PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[#059669] hover:bg-[#047857] text-white shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {editSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={13} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 8. MODAL: HAPUS (Exact Matching Visily Mockup Page 3)         */}
        {/* ============================================================ */}
        {isDeleteModalOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-[340px] bg-white rounded-2xl shadow-xl border border-slate-100 p-7 text-center">
              <h3 className="text-sm font-semibold text-slate-800 mb-6 leading-relaxed">
                Apakah Anda yakin ingin menghapus data ini?
              </h3>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteSubmitting}
                  className="w-24 py-2 text-xs font-bold rounded-lg bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 transition-colors uppercase tracking-wider"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteSubmitting}
                  className="w-24 py-2 text-xs font-bold rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-2xs transition-colors uppercase tracking-wider disabled:opacity-50"
                >
                  {deleteSubmitting ? "..." : "YA"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 9. MODAL: EKSPOR & PREVIEW DOKUMEN RESMI (FR-005-SMKI)       */}
        {/* ============================================================ */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center flex-shrink-0">
                    <Printer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pratinjau Dokumen Cetak (FR-005-SMKI Formulir Rencana Audit)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Format resmi 100% presisi sesuai standar dokumen ISO 27001 Diskominfo Jawa Barat
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body / Paper Sheet Preview */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex justify-center">
                {/* A4 Sheet Container */}
                <div className="w-full max-w-[210mm] min-h-[260mm] bg-white p-8 sm:p-10 shadow-md border border-slate-300 font-sans text-slate-900 flex flex-col justify-between">
                  <div>
                    {/* 1. Header Grid Table (Matching Word Template FR-005) */}
                    <div className="w-full border border-black mb-4 flex items-stretch">
                      {/* Kolom 1: Logo Diskominfo */}
                      <div className="w-36 p-2.5 border-r border-black flex flex-col items-center justify-center text-center">
                        <img
                          src="/logo-diskominfo-jabar.png"
                          alt="Logo Diskominfo Provinsi Jawa Barat"
                          className="w-14 h-auto object-contain max-h-20"
                        />
                      </div>

                      {/* Kolom 2: Judul Dokumen */}
                      <div className="flex-1 p-3 border-r border-black flex items-center justify-center text-center">
                        <h2 className="text-base sm:text-lg font-bold text-black tracking-normal">
                          Formulir Rencana Audit
                        </h2>
                      </div>

                      {/* Kolom 3: Metadata Kontrol Dokumen */}
                      <div className="w-56 text-[10px] text-black divide-y divide-black flex flex-col justify-between">
                        <div className="grid grid-cols-[85px_10px_1fr] p-1.5 items-center">
                          <span className="font-normal">No. Dokumen</span>
                          <span>:</span>
                          <span className="font-normal">{lookups.default_meta.no_dokumen}</span>
                        </div>
                        <div className="grid grid-cols-[85px_10px_1fr] p-1.5 items-center">
                          <span className="font-normal">No. Revisi</span>
                          <span>:</span>
                          <span className="font-normal">{lookups.default_meta.no_revisi}</span>
                        </div>
                        <div className="grid grid-cols-[85px_10px_1fr] p-1.5 items-center">
                          <span className="font-normal">Tanggal Berlaku</span>
                          <span>:</span>
                          <span className="font-normal">{lookups.default_meta.tanggal_berlaku || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Main Data Table (Multi-level Header Auditee: Bidang & Lokasi) */}
                    <table className="w-full text-left text-[11px] border border-black border-collapse">
                      <thead>
                        <tr className="border-b border-black text-black font-bold text-center bg-white">
                          <th rowSpan={2} className="p-2 border-r border-black w-10 text-center align-middle">
                            No
                          </th>
                          <th rowSpan={2} className="p-2 border-r border-black text-center align-middle">
                            Persyaratan/Kontrol/Prosedur SMKI
                          </th>
                          <th colSpan={2} className="p-1.5 border-b border-r border-black text-center">
                            Auditee
                          </th>
                          <th rowSpan={2} className="p-2 border-r border-black w-24 text-center align-middle">
                            Tanggal<br />Audit
                          </th>
                          <th rowSpan={2} className="p-2 w-32 text-center align-middle">
                            Auditor
                          </th>
                        </tr>
                        <tr className="border-b border-black text-black font-bold text-center bg-white">
                          <th className="p-1.5 border-r border-black w-36 text-center">
                            Bidang
                          </th>
                          <th className="p-1.5 border-r border-black w-32 text-center">
                            Lokasi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {items.map((item, idx) => (
                          <tr key={idx} className="border-b border-black">
                            <td className="p-2 text-center border-r border-black align-top font-normal">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-black align-top font-normal">
                              {item.kontrol_SMKI}
                            </td>
                            <td className="p-2 border-r border-black align-top font-normal">
                              {item.bidang_nama}
                            </td>
                            <td className="p-2 border-r border-black align-top font-normal">
                              {item.lokasi_nama}
                            </td>
                            <td className="p-2 border-r border-black text-center align-top font-normal whitespace-nowrap">
                              {formatTanggalSingkat(item.tanggal_audit)}
                            </td>
                            <td className="p-2 align-top font-normal">
                              {item.auditor_nama}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Bottom Signature Block (Left-Aligned, matching Screenshot 1) */}
                  <div className="pt-8">
                    <div className="text-left text-xs font-sans text-black max-w-xs">
                      <p className="leading-tight">Mengetahui,</p>
                      <p className="leading-tight font-medium mb-16">Auditor</p>
                      <p className="font-normal tracking-wide">
                        {pdfLeadAuditor ? `( ${pdfLeadAuditor} )` : "(............................................)"}
                      </p>
                      {pdfLeadAuditorNip && pdfLeadAuditorNip !== "-" && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          NIP. {pdfLeadAuditorNip}
                        </p>
                      )}
                    </div>

                    {/* Document Classification Footer */}
                    <div className="mt-10 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 italic">
                      <span>*Klasifikasi: Internal*</span>
                      <span className="not-italic text-slate-400">Page 1 of 1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-white">
                <span className="text-xs text-slate-500">
                  Total <strong>{items.length}</strong> butir rencana audit tercantum dalam formulir ini.
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                  >
                    Tutup
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    <Printer size={14} className="text-slate-600" />
                    <span>Print Pratinjau</span>
                  </button>

                  <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[#059669] hover:bg-[#047857] text-white shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Memproses PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileDown size={14} />
                        <span>Unduh PDF Resmi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </ServiceRouteGuard>
  );
}
