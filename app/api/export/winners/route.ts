import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import * as XLSX from "xlsx";

const REWARDS_FILE = join(process.cwd(), "data", "rewards.json");

interface Reward {
  id: string;
  name: string;
  image: string;
  totalQuantity: number;
  remainingQuantity: number;
  winners: string[];
}

export async function GET() {
  try {
    // Read rewards data
    if (!existsSync(REWARDS_FILE)) {
      return NextResponse.json(
        { error: "No rewards data found" },
        { status: 404 }
      );
    }

    const fileContent = await readFile(REWARDS_FILE, "utf-8");
    const data = JSON.parse(fileContent);
    const rewards: Reward[] = data.rewards || [];

    // Find the maximum number of winners across all rewards
    const maxWinners = Math.max(...rewards.map(r => r.winners.length), 0);
    
    // Prepare data for Excel
    const excelData: any[] = [];
    
    // Build header row dynamically
    const headerRow: any[] = [
      "Reward Name",
      "Total Quantity",
      "Winners Count",
    ];
    
    // Add winner columns dynamically based on max winners
    for (let i = 1; i <= Math.max(maxWinners, 1); i++) {
      headerRow.push(`Winner #${i}`);
    }
    
    excelData.push(headerRow);

    // Add data rows
    rewards.forEach((reward) => {
      const row: any[] = [
        reward.name,
        reward.totalQuantity,
        reward.winners.length,
      ];

      // Add all winners
      reward.winners.forEach((winner) => {
        row.push(winner);
      });
      
      // Fill remaining columns with empty strings if this reward has fewer winners
      const remainingColumns = maxWinners - reward.winners.length;
      for (let i = 0; i < remainingColumns; i++) {
        row.push("");
      }

      excelData.push(row);
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Reward Name
      { wch: 15 }, // Total Quantity
      { wch: 15 }, // Winners Count
    ];
    // Add widths for winner columns (dynamic based on max winners)
    for (let i = 0; i < Math.max(maxWinners, 1); i++) {
      columnWidths.push({ wch: 20 });
    }
    worksheet["!cols"] = columnWidths;

    // Style header row (first row)
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFD4AF37" } }, // Gold background
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Winners");

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const filename = `winners-export-${timestamp}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting winners:", error);
    return NextResponse.json(
      { error: "Failed to export winners" },
      { status: 500 }
    );
  }
}

