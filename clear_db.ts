import Database from "better-sqlite3";
const db = new Database("results.db");
db.exec("DELETE FROM results");
console.log("Database cleared.");
