import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DetailAuditItem, RencanaAuditMetadata } from "@/services/api";

const BULAN_INDO = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatTanggalIndo(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = BULAN_INDO[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTanggalSingkat(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = BULAN_INDO[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Konversi image URL ke Base64
 */
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Gagal memuat logo untuk PDF:", e);
    return null;
  }
}

export interface ExportPdfOptions {
  items: DetailAuditItem[];
  metadata?: Partial<RencanaAuditMetadata>;
  leadAuditorName?: string;
  leadAuditorNip?: string;
  approvedByName?: string;
  approvedByNip?: string;
  tanggalDokumen?: string;
}

/**
 * Menghasilkan Dokumen PDF Resmi Formulir Rencana Audit (FR-005-SMKI)
 * 100% Presisi sesuai Template Microsoft Word Resmi:
 * - Orientasi A4 Portrait
 * - Header 3 Kolom: Logo Diskominfo Jabar | Judul "Formulir Rencana Audit" | Kotak Kontrol Dokumen
 * - Tabel Data dengan Multi-level Header (Auditee: Bidang & Lokasi)
 * - Blok Tanda Tangan Auditor di Kiri Bawah ("Mengetahui, Auditor")
 * - Catatan Kaki "*Klasifikasi: Internal*"
 */
export async function exportRencanaAuditToPdf(options: ExportPdfOptions): Promise<void> {
  const {
    items,
    metadata,
    leadAuditorName = "",
    leadAuditorNip = "",
  } = options;

  const noDokumen = metadata?.no_dokumen || "F05-SMKI";
  const noRevisi = metadata?.no_revisi || "1.0";
  const tglBerlaku = metadata?.tanggal_berlaku || "";

  // Inisialisasi dokumen jsPDF (A4 Portrait, margin 15mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180 mm
  let currentY = 15;

  // ============================================================
  // 1. HEADER GRID TABLE (Exact Match with Word Template FR-005)
  // ============================================================
  const headerHeight = 28;
  const col1Width = 36; // Kolom Logo
  const col3Width = 62; // Kolom Metadata Dokumen
  const col2Width = contentWidth - col1Width - col3Width; // Kolom Judul (82mm)

  // Outer Border Header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, headerHeight);

  // Garis Pemisah Kolom 1 (Logo | Judul)
  doc.line(marginX + col1Width, currentY, marginX + col1Width, currentY + headerHeight);

  // Garis Pemisah Kolom 2 (Judul | Metadata)
  doc.line(marginX + col1Width + col2Width, currentY, marginX + col1Width + col2Width, currentY + headerHeight);

  // Garis Horizontal di Kolom 3 (3 Baris Metadata)
  const rowHeight = headerHeight / 3; // ~9.33mm
  doc.line(
    marginX + col1Width + col2Width,
    currentY + rowHeight,
    marginX + contentWidth,
    currentY + rowHeight
  );
  doc.line(
    marginX + col1Width + col2Width,
    currentY + rowHeight * 2,
    marginX + contentWidth,
    currentY + rowHeight * 2
  );

  // Garis Vertikal Pemisah Label dan Nilai di Kolom 3
  const metaLabelWidth = 28;
  doc.line(
    marginX + col1Width + col2Width + metaLabelWidth,
    currentY,
    marginX + col1Width + col2Width + metaLabelWidth,
    currentY + headerHeight
  );

  // Isi Kolom 1: Logo Diskominfo Jawa Barat
  const logoBase64 = await getBase64ImageFromUrl("/logo-diskominfo-jabar.png") || await getBase64ImageFromUrl("/logo-jabar.png");
  if (logoBase64) {
    try {
      // Pusatkan logo di dalam kotak 36mm x 28mm
      doc.addImage(logoBase64, "PNG", marginX + 9, currentY + 3, 18, 22);
    } catch (e) {
      console.warn("Gagal menyematkan logo ke PDF:", e);
    }
  }

  // Isi Kolom 2: Judul Dokumen (Centered Bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text("Formulir Rencana Audit", marginX + col1Width + (col2Width / 2), currentY + 16, {
    align: "center",
  });

  // Isi Kolom 3: 3 Baris Dokumen Kontrol (No. Dokumen, No. Revisi, Tanggal Berlaku)
  const metaX = marginX + col1Width + col2Width;
  doc.setFontSize(8.5);

  // Baris 1: No. Dokumen
  doc.setFont("helvetica", "normal");
  doc.text("No. Dokumen", metaX + 2.5, currentY + 6);
  doc.text(":", metaX + metaLabelWidth + 2, currentY + 6);
  doc.text(noDokumen, metaX + metaLabelWidth + 5.5, currentY + 6);

  // Baris 2: No. Revisi
  doc.text("No. Revisi", metaX + 2.5, currentY + rowHeight + 6);
  doc.text(":", metaX + metaLabelWidth + 2, currentY + rowHeight + 6);
  doc.text(noRevisi, metaX + metaLabelWidth + 5.5, currentY + rowHeight + 6);

  // Baris 3: Tanggal Berlaku
  doc.text("Tanggal Berlaku", metaX + 2.5, currentY + (rowHeight * 2) + 6);
  doc.text(":", metaX + metaLabelWidth + 2, currentY + (rowHeight * 2) + 6);
  doc.text(tglBerlaku, metaX + metaLabelWidth + 5.5, currentY + (rowHeight * 2) + 6);

  currentY += headerHeight + 5;

  // ============================================================
  // 2. DATA TABLE WITH MULTI-LEVEL HEADER (Matching Word Template)
  // ============================================================
  const tableRows = items.map((item, idx) => [
    idx + 1,
    item.kontrol_SMKI,
    item.bidang_nama,
    item.lokasi_nama,
    formatTanggalSingkat(item.tanggal_audit),
    item.auditor_nama,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        { content: "No", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Persyaratan/Kontrol/Prosedur SMKI", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Auditee", colSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Tanggal\nAudit", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
        { content: "Auditor", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      ],
      [
        { content: "Bidang", styles: { halign: "center", valign: "middle" } },
        { content: "Lokasi", styles: { halign: "center", valign: "middle" } },
      ],
    ],
    body: tableRows,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 2.2,
      overflow: "linebreak",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 8.5,
      fontStyle: "bold",
      lineWidth: 0.25,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // No
      1: { cellWidth: 54 },                   // Persyaratan/Kontrol
      2: { cellWidth: 42 },                   // Auditee Bidang
      3: { cellWidth: 32 },                   // Auditee Lokasi
      4: { cellWidth: 20, halign: "center" }, // Tanggal Audit
      5: { cellWidth: 22 },                   // Auditor
    },
  });

  // ============================================================
  // 3. SIGNATURE BLOCK (Left-aligned, matching Screenshot 1)
  // ============================================================
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 60;
  let signY = finalY + 12;

  // Jika ruang sisa tidak cukup untuk blok tanda tangan, buat halaman baru
  if (signY + 40 > pageHeight - 20) {
    doc.addPage();
    signY = 20;
  }

  const signX = marginX + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);

  doc.text("Mengetahui,", signX, signY);
  doc.text("Auditor", signX, signY + 5);

  const signLineY = signY + 28;
  const auditorDisplayName = leadAuditorName
    ? `( ${leadAuditorName} )`
    : "(............................................)";

  doc.text(auditorDisplayName, signX - 2, signLineY);

  if (leadAuditorNip && leadAuditorNip !== "-") {
    doc.setFontSize(8.5);
    doc.text(`NIP. ${leadAuditorNip}`, signX, signLineY + 4.5);
  }

  // ============================================================
  // 4. FOOTER: "*Klasifikasi: Internal*"
  // ============================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text("*Klasifikasi: Internal*", marginX, pageHeight - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX - 16, pageHeight - 10);
  }

  // Simpan file PDF
  doc.save(`FR-005-SMKI_Formulir_Rencana_Audit.pdf`);
}
