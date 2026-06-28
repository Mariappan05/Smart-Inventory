import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { toServiceError } from "@/services/base/serviceError";
import { ReportRepository } from "@/repositories/reportRepository";
import type { ReportDataset, ReportFilters, ReportMeta, ReportType } from "@/types/reports";
import { fmtDate, fmtDateTime } from "@/utils/dateFormat";

export class ReportService {
  constructor(private readonly reportRepository = new ReportRepository()) {}

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      // ISO date string - format it
      return fmtDateTime(value);
    }
    return String(value);
  }

  private getTitle(type: ReportType) {
    const titles: Record<ReportType, string> = {
      productHistory: "Product History Report",
      schedule: "Schedule Report",
      request: "Request Report",
    };

    return titles[type];
  }

  async getReport(filters: ReportFilters, plantId?: string) {
    try {
      switch (filters.type) {
        case "productHistory":
          return await this.reportRepository.getProductHistoryReport(filters, plantId);
        case "schedule":
          return await this.reportRepository.getScheduleReport(filters, plantId);
        case "request":
          return await this.reportRepository.getRequestReport(filters, plantId);
      }
    } catch (error) {
      throw toServiceError(error, "Failed to fetch report");
    }
  }

  async getMeta(filters: ReportFilters, plantId?: string): Promise<ReportMeta> {
    const report = await this.getReport(filters, plantId);
    if (!report) {
      throw new Error("Report not found");
    }

    return {
      type: filters.type,
      title: this.getTitle(filters.type),
      total: report.total,
      page: report.page,
      pageSize: report.pageSize,
      totalPages: report.totalPages,
      generatedAt: fmtDateTime(new Date()),
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
    };
  }

  private async generateExcel(report: ReportDataset, meta: ReportMeta) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(meta.title);
    const rows = report.rows as Array<Record<string, string | number | null | undefined>>;
    const columns = rows.length ? Object.keys(rows[0]) : [];

    sheet.addRow([meta.title]);
    sheet.addRow([`Generated at: ${meta.generatedAt}`]);
    sheet.addRow([`Total records: ${meta.total}`]);
    sheet.addRow([]);

    if (columns.length) {
      sheet.addRow(columns.map((column) => column.toUpperCase()));
      rows.forEach((row) => {
        sheet.addRow(columns.map((column) => this.formatValue(row[column])));
      });
    }

    sheet.getRow(1).font = { bold: true, size: 16 };
    sheet.getRow(4).font = { bold: true };
    sheet.columns = columns.map((column) => ({ header: column.toUpperCase(), key: column, width: 20 }));

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async generatePdf(report: ReportDataset, meta: ReportMeta) {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(18).text(meta.title, { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(`Generated at: ${meta.generatedAt}`);
      doc.text(`Total records: ${meta.total}`);
      if (meta.search) doc.text(`Search: ${meta.search}`);
      if (meta.startDate) doc.text(`Start date: ${meta.startDate}`);
      if (meta.endDate) doc.text(`End date: ${meta.endDate}`);
      doc.moveDown();

      for (const row of report.rows as Array<Record<string, string | number | null | undefined>>) {
        const line = Object.entries(row)
          .map(([key, value]) => `${key}: ${this.formatValue(value)}`)
          .join(" | ");
        doc.fontSize(9).text(line, { width: 500 });
        doc.moveDown(0.6);
      }

      doc.end();
    });
  }

  async exportReport(filters: ReportFilters, format: "excel" | "pdf", plantId?: string) {
    const report = await this.getReport(filters, plantId);
    if (!report) {
      throw new Error("Report not found");
    }

    const meta = await this.getMeta(filters, plantId);
    const dataset: ReportDataset = { type: filters.type, rows: report.data as never[] } as ReportDataset;

    if (format === "excel") {
      const buffer = await this.generateExcel(dataset, meta);
      return {
        buffer,
        fileName: `${filters.type}-report.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }

    const buffer = await this.generatePdf(dataset, meta);
    return {
      buffer,
      fileName: `${filters.type}-report.pdf`,
      contentType: "application/pdf",
    };
  }
}
