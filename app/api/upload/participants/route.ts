import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    const isValidType =
      validTypes.includes(file.type) ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls") ||
      file.name.endsWith(".csv");

    if (!isValidType) {
      return NextResponse.json(
        { error: "File must be an Excel file (.xlsx, .xls) or CSV (.csv)" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Read and parse the file
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract participant names from the first column
    const participants: string[] = [];
    jsonData.forEach((row: any) => {
      if (Array.isArray(row) && row[0]) {
        const name = String(row[0]).trim();
        if (name) {
          participants.push(name);
        }
      }
    });

    if (participants.length === 0) {
      return NextResponse.json(
        {
          error:
            "No participants found in the Excel file. Please ensure the first column contains participant names.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      participants,
      count: participants.length,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error uploading participants:", error);
    return NextResponse.json(
      { error: "Failed to process participants file" },
      { status: 500 }
    );
  }
}

