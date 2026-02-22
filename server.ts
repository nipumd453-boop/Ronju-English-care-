import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const db = new Database("results.db");

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT,
    student_name TEXT,
    class TEXT,
    batch TEXT,
    subject TEXT,
    marks INTEGER,
    grade TEXT,
    exam_date TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_result ON results (registration_number, class, batch, subject, exam_date);
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Multer for file uploads
  const upload = multer({ dest: "uploads/" });

  // API: Search Results
  app.get("/api/results", (req, res) => {
    const { reg, className, batch } = req.query;
    
    if (!reg || !className || !batch) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const stmt = db.prepare("SELECT * FROM results WHERE registration_number = ? AND class = ? AND batch = ?");
    const results = stmt.all(reg, className, batch);
    
    res.json(results);
  });

  // API: Upload Results (Excel/CSV)
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const workbook = xlsx.readFile(req.file.path);
      const allData: any[] = [];
      let sheetsProcessed = 0;

      workbook.SheetNames.forEach(sheetName => {
        // Expected sheet name format: "Batch-9B" or "Batch-5D"
        // But let's be more flexible: look for numbers and a letter
        const match = sheetName.match(/(\d+)\s*([A-D])/i);
        
        let className = "Unknown";
        let batch = "Unknown";

        if (match) {
          className = match[1];
          batch = match[2].toUpperCase();
        } else {
          // If no match, maybe it's just one sheet or named differently
          // We'll try to process it anyway if it's the only sheet or has data
        }

        const worksheet = workbook.Sheets[sheetName];
        
        // Try to find headers automatically if range 4 doesn't work
        // Or just use range 4 as requested for the specific template
        const data = xlsx.utils.sheet_to_json(worksheet, { range: 4 });

        if (data.length > 0) {
          sheetsProcessed++;
          data.forEach((row: any) => {
            // Support different header names just in case
            const reg = row.Reg || row.Registration || row['Registration No'] || row['ID'];
            const name = row.Name || row['Student Name'] || row['Full Name'];
            const mark = row.Mark || row.Marks || row.Score;

            if (reg && name) {
              // Handle marks that might be strings or numbers
              let finalMark = 0;
              if (typeof mark === 'number') {
                finalMark = mark;
              } else if (typeof mark === 'string') {
                finalMark = parseFloat(mark) || 0;
              }

              allData.push({
                registration_number: reg.toString().trim(),
                student_name: name.toString().trim(),
                class: className,
                batch: batch,
                marks: finalMark,
                subject: "English",
                grade: calculateGrade(finalMark),
                exam_date: "Exam-4"
              });
            }
          });
        }
      });

      if (allData.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: "No valid data found. Please ensure the Excel follows the template (Data starts from row 5 with headers: SL, Name, Reg, Mark)." 
        });
      }

      const insert = db.prepare(`
        INSERT OR REPLACE INTO results (registration_number, student_name, class, batch, subject, marks, grade, exam_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((rows: any[]) => {
        for (const row of rows) {
          insert.run(
            row.registration_number,
            row.student_name,
            row.class,
            row.batch,
            row.subject,
            row.marks,
            row.grade,
            row.exam_date
          );
        }
      });

      insertMany(allData);
      fs.unlinkSync(req.file.path);
      res.json({ success: true, count: allData.length, sheets: sheetsProcessed });
    } catch (error: any) {
      console.error("Upload error details:", error);
      res.status(500).json({ error: `Failed to process file: ${error.message}` });
    }
  });

  function calculateGrade(marks: number): string {
    if (marks >= 80) return "A+";
    if (marks >= 70) return "A";
    if (marks >= 60) return "A-";
    if (marks >= 50) return "B";
    if (marks >= 40) return "C";
    if (marks >= 33) return "D";
    return "F";
  }

  // API: Clear all data (Admin only - simplified for now)
  app.post("/api/clear", (req, res) => {
    db.exec("DELETE FROM results");
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
