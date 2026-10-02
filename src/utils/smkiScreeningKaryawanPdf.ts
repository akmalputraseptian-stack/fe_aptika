import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ScreeningKaryawanItem } from "@/services/api";

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

/**
 * Menghasilkan Dokumen PDF Resmi Berita Acara Screening Karyawan Outsourcing
 * Format FR-012/KOM.03.05/SANDIKAMI
 */
export async function exportScreeningKaryawanToPdf(item: ScreeningKaryawanItem): Promise<void> {
  const noDokumen = "FR-012/KOM.03.05/SANDIKAMI/";
  const noRevisi = "1.1";
  const tglBerlaku = "20 Januari 2022";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180 mm
  let currentY = 15;

  // ============================================================
  // 1. HEADER RESMI (3 KOLOM KONTROL DOKUMEN)
  // ============================================================
  const headerHeight = 28;
  const col1Width = 34; // Logo
  const col3Width = 66; // Metadata
  const col2Width = contentWidth - col1Width - col3Width; // Judul (80mm)

  // Outer Border Header
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, headerHeight);

  // Garis Pemisah Kolom 1
  doc.line(marginX + col1Width, currentY, marginX + col1Width, currentY + headerHeight);

  // Garis Pemisah Kolom 2
  doc.line(marginX + col1Width + col2Width, currentY, marginX + col1Width + col2Width, currentY + headerHeight);

  // Garis Horizontal di Kolom 3 (3 Baris Metadata)
  const rowHeight = headerHeight / 3;
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

  // Garis Vertikal Pemisah Label dan Titik Dua di Kolom 3
  const metaLabelWidth = 26;
  doc.line(
    marginX + col1Width + col2Width + metaLabelWidth,
    currentY,
    marginX + col1Width + col2Width + metaLabelWidth,
    currentY + headerHeight
  );

  // Logo Diskominfo / Jabar
  const logoBase64 =
    (await getBase64ImageFromUrl("/logo-jabar.png")) ||
    (await getBase64ImageFromUrl("/logo-diskominfo-jabar.png"));
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", marginX + 8, currentY + 3, 18, 22);
    } catch (e) {
      console.warn("Gagal menyematkan logo ke PDF:", e);
    }
  }

  // Judul Dokumen (Kolom 2)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("BERITA ACARA", marginX + col1Width + col2Width / 2, currentY + 11, {
    align: "center",
  });
  doc.setFontSize(9.5);
  doc.text(
    "SCREENING KARYAWAN\nOUTSOURCING",
    marginX + col1Width + col2Width / 2,
    currentY + 17,
    { align: "center" }
  );

  // Metadata Dokumen (Kolom 3)
  const metaX = marginX + col1Width + col2Width;
  doc.setFontSize(7.5);

  // Baris 1: No. Dokumen
  doc.setFont("helvetica", "normal");
  doc.text("No. Dokumen", metaX + 2, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.text(noDokumen, metaX + metaLabelWidth + 3, currentY + 6);

  // Baris 2: No. Revisi
  doc.setFont("helvetica", "normal");
  doc.text("No. Revisi", metaX + 2, currentY + rowHeight + 6);
  doc.setFont("helvetica", "bold");
  doc.text(noRevisi, metaX + metaLabelWidth + 3, currentY + rowHeight + 6);

  // Baris 3: Tanggal Berlaku
  doc.setFont("helvetica", "normal");
  doc.text("Tanggal Berlaku", metaX + 2, currentY + rowHeight * 2 + 6);
  doc.setFont("helvetica", "bold");
  doc.text(tglBerlaku, metaX + metaLabelWidth + 3, currentY + rowHeight * 2 + 6);

  currentY += headerHeight + 6;

  // ============================================================
  // 2. DATA KARYAWAN OUTSOURCING
  // ============================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("DATA KARYAWAN OUTSOURCING", marginX, currentY);
  currentY += 2;

  const infoTableY = currentY;
  const infoRowH = 5.8;
  const labelW = 42;
  const colonW = 4;

  const infoRows = [
    { label: "Periode Tahun", val: String(item.tahun || "-") },
    { label: "Nama Karyawan", val: item.nama_karyawan || "-" },
    { label: "Jabatan", val: item.jabatan?.nama_jabatan || "-" },
    { label: "Penempatan di Bidang", val: item.bidang?.nama_bidang || "-" },
    { label: "Tanggal Screening", val: formatTanggalIndo(item.tanggal_screening) },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  infoRows.forEach((row, i) => {
    const yPos = infoTableY + 4 + i * infoRowH;
    doc.text(row.label, marginX, yPos);
    doc.text(":", marginX + labelW, yPos);
    doc.setFont("helvetica", "bold");
    doc.text(row.val, marginX + labelW + colonW, yPos);
    doc.setFont("helvetica", "normal");
  });

  currentY += infoRows.length * infoRowH + 6;

  // ============================================================
  // 3. TABEL CHECKLIST 5 ITEM SCREENING
  // ============================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("HASIL PEMERIKSAAN DOKUMEN SCREENING", marginX, currentY);
  currentY += 2;

  const defaultItems = [
    "Data Identitas (KTP, NPWP, KK)",
    "Tingkat Pendidikan (Ijazah & Sertifikat)",
    "Pemberi Referensi",
    "Pengalaman Kerja Sebelumnya",
    "Catatan lain yang diperlukan",
  ];

  const tableData = defaultItems.map((title, idx) => {
    const found = item.details?.find((d) => d.id_item === idx + 1);
    const isAda = found ? found.status === "Ada" : false;
    const isTidak = found ? found.status === "Tidak" : false;
    return [
      idx + 1,
      title,
      isAda ? "V" : "-",
      isTidak ? "V" : "-",
      found?.keterangan || "-",
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        { content: "No", styles: { halign: "center", valign: "middle" } },
        { content: "Item Pemeriksaan", styles: { halign: "center", valign: "middle" } },
        { content: "Ada", styles: { halign: "center", valign: "middle" } },
        { content: "Tidak", styles: { halign: "center", valign: "middle" } },
        { content: "Keterangan", styles: { halign: "center", valign: "middle" } },
      ],
    ],
    body: tableData,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fontStyle: "bold",
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      4: { cellWidth: "auto" },
    },
  });

  // @ts-expect-error - autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable.finalY + 6;

  // ============================================================
  // 4. KESIMPULAN AKHIR PEMERIKSAAN
  // ============================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("KESIMPULAN AKHIR", marginX, currentY);
  currentY += 3;

  const conclusionBoxHeight = 16;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(marginX, currentY, contentWidth, conclusionBoxHeight);

  const isPerlu = item.kesimpulan === "Perlu melengkapi administrasi";
  const isLengkap = item.kesimpulan === "Administrasi Lengkap";

  // Checkbox 1: Perlu melengkapi administrasi
  doc.rect(marginX + 5, currentY + 3.5, 4, 4);
  if (isPerlu) {
    doc.setFont("helvetica", "bold");
    doc.text("V", marginX + 6, currentY + 6.8);
  }
  doc.setFont("helvetica", isPerlu ? "bold" : "normal");
  doc.setFontSize(8.5);
  doc.text("Perlu melengkapi administrasi", marginX + 12, currentY + 6.5);

  // Checkbox 2: Administrasi Lengkap
  doc.rect(marginX + 5, currentY + 9.5, 4, 4);
  if (isLengkap) {
    doc.setFont("helvetica", "bold");
    doc.text("V", marginX + 6, currentY + 12.8);
  }
  doc.setFont("helvetica", isLengkap ? "bold" : "normal");
  doc.text("Administrasi Lengkap", marginX + 12, currentY + 12.5);

  currentY += conclusionBoxHeight + 6;

  // ============================================================
  // 5. CATATAN
  // ============================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("CATATAN TAMBAHAN", marginX, currentY);
  currentY += 3;

  const notesHeight = 16;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(marginX, currentY, contentWidth, notesHeight);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const noteText = item.catatan || "Karyawan memenuhi semua kriteria dokumen yang dipersyaratkan.";
  doc.text(noteText, marginX + 4, currentY + 5.5, {
    maxWidth: contentWidth - 8,
  });

  currentY += notesHeight + 10;

  // ============================================================
  // 6. BLOK TANDA TANGAN (BOTTOM RIGHT)
  // ============================================================
  const sigX = marginX + contentWidth - 65;
  const tglScreeningFormatted = formatTanggalIndo(item.tanggal_screening);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Bandung, ${tglScreeningFormatted}`, sigX + 32.5, currentY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("Petugas Verifikator Screening", sigX + 32.5, currentY + 5, { align: "center" });

  currentY += 26;
  doc.text("( .................................................. )", sigX + 32.5, currentY, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Pemerintah Provinsi Jawa Barat", sigX + 32.5, currentY + 4, { align: "center" });

  // Save PDF
  const filename = `Berita_Acara_Screening_${(item.nama_karyawan || "Karyawan").replace(/\s+/g, "_")}_${item.tahun || 2026}.pdf`;
  doc.save(filename);
}
