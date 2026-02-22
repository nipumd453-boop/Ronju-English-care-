import Database from "better-sqlite3";
const db = new Database("results.db");

try {
    console.log("Cleaning up duplicates...");
    db.exec(`
        DELETE FROM results 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM results 
            GROUP BY registration_number, class, batch, subject, exam_date
        )
    `);
    console.log("Duplicates removed.");

    console.log("Creating unique index...");
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_result ON results (registration_number, class, batch, subject, exam_date)`);
    console.log("Unique index created successfully.");
} catch (e) {
    console.error("Error during cleanup:", e.message);
}
