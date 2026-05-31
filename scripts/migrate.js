/**
 * =============================================================================
 * MIGRATION SCRIPT — Quantum Learning System
 * =============================================================================
 *
 * Menangani semua breaking changes dari sesi refactoring batch 1–3.
 *
 * BREAKING CHANGES yang ditangani:
 *   [M1] Jadwal.tanggal          String → Date
 *   [M2] BankSoal.durasi         → durasiMenit  (rename field)
 *   [M3] BankSoal.kodeCabang     Tambah field baru (default: CPT)
 *   [M4] Quiz.durasi             → durasiMenit  (rename field)
 *   [M5] Quiz.kodeCabang         Tambah field baru (default: CPT)
 *   [M6] LatihanSoal.kodeCabang  Tambah field baru (default: CPT)
 *   [M7] Quiz.pembuatId null     Laporan dokumen tanpa pembuat (manual fix)
 *
 * CARA PAKAI:
 *   # Dry-run (aman, tidak mengubah data apapun):
 *   node scripts/migrate.js
 *
 *   # Eksekusi sungguhan:
 *   node scripts/migrate.js --run
 *
 *   # Jalankan migrasi tertentu saja:
 *   node scripts/migrate.js --run --only=M1,M3
 *
 * SYARAT:
 *   - Node.js 18+
 *   - MONGODB_URI di environment / .env.local
 *   - Backup database sudah dilakukan sebelum --run
 *
 * =============================================================================
 */

import mongoose from "mongoose";
import { config } from "dotenv";

// Muat environment variables dari .env.local
config({ path: ".env.local" });

// ============================================================================
// KONFIGURASI
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("[migrate] ERROR: MONGODB_URI tidak ditemukan di environment.");
  process.exit(1);
}

// Parse argumen CLI
const args        = process.argv.slice(2);
const IS_DRY_RUN  = !args.includes("--run");
const ONLY_FLAG   = args.find((a) => a.startsWith("--only="));
const ONLY_IDS    = ONLY_FLAG
  ? ONLY_FLAG.replace("--only=", "").split(",").map((s) => s.trim())
  : null;

// Kode cabang default untuk dokumen lama yang belum punya kodeCabang
const DEFAULT_KODE_CABANG = "000000"; // CABANG_QUANTUM.PUSAT.id

// Timezone Jakarta untuk konversi tanggal String → Date
const JAKARTA_OFFSET = "+07:00";

// ============================================================================
// UTILITIES
// ============================================================================

/** Log dengan prefix [migrate] */
const log   = (...args) => console.log("[migrate]", ...args);
const warn  = (...args) => console.warn("[migrate] ⚠", ...args);
const error = (...args) => console.error("[migrate] ✖", ...args);
const ok    = (...args) => console.log("[migrate] ✔", ...args);

/** Tampilkan header tiap migrasi */
function printHeader(id, description) {
  console.log("\n" + "─".repeat(60));
  log(`[${id}] ${description}`);
  if (IS_DRY_RUN) log("Mode: DRY-RUN — tidak ada perubahan yang disimpan.");
  console.log("─".repeat(60));
}

/** Ringkasan hasil migrasi */
function printResult(matched, modified) {
  if (IS_DRY_RUN) {
    log(`Akan mempengaruhi: ${matched} dokumen.`);
  } else {
    ok(`Selesai — matched: ${matched}, modified: ${modified}.`);
  }
}

/**
 * Mengkonversi string tanggal "YYYY-MM-DD" ke objek Date dengan timezone Jakarta.
 * Contoh: "2025-06-29" → Date("2025-06-29T00:00:00+07:00")
 *
 * Alasan: new Date("2025-06-29") menghasilkan UTC midnight (17:00 WIB hari sebelumnya),
 * yang salah untuk data jadwal yang konteksnya selalu WIB.
 *
 * @param {string} str
 * @returns {Date|null}
 */
function parseJakartaDate(str) {
  if (!str || typeof str !== "string") return null;
  const clean = str.trim();
  // Sudah berupa ISO string → skip konversi (idempotent)
  if (clean.includes("T")) return null;
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return new Date(`${clean}T00:00:00${JAKARTA_OFFSET}`);
  }
  return null;
}

// ============================================================================
// KONEKSI DATABASE
// ============================================================================

async function connect() {
  log("Menghubungkan ke MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });
  ok("Terhubung ke MongoDB.");
}

async function disconnect() {
  await mongoose.disconnect();
  log("Koneksi MongoDB ditutup.");
}

// ============================================================================
// HELPER: cek apakah migrasi ini harus dijalankan
// ============================================================================

function shouldRun(id) {
  return !ONLY_IDS || ONLY_IDS.includes(id);
}

// ============================================================================
// [M1] Jadwal.tanggal — String → Date
// ============================================================================
//
// Dokumen lama menyimpan tanggal sebagai string "YYYY-MM-DD".
// Setelah migrasi ini, semua tanggal tersimpan sebagai Date UTC+7.
//
// IDEMPOTENT: Dokumen yang sudah bertipe Date dilewati (tidak disentuh).
// ============================================================================

async function migrasiM1(db) {
  printHeader("M1", "Jadwal.tanggal — String → Date");

  const collection = db.collection("jadwals");

  // Temukan semua dokumen yang tanggal-nya masih berupa string
  const cursor = collection.find({ tanggal: { $type: "string" } });
  const docs   = await cursor.toArray();

  log(`Dokumen dengan tanggal bertipe String: ${docs.length}`);

  if (docs.length === 0) {
    ok("Tidak ada dokumen yang perlu dimigrasi. Lewat.");
    return;
  }

  // Preview 5 dokumen pertama
  log("Contoh data yang akan dikonversi:");
  docs.slice(0, 5).forEach((d) => {
    const parsed = parseJakartaDate(d.tanggal);
    log(`  _id: ${d._id} | "${d.tanggal}" → ${parsed?.toISOString() ?? "GAGAL PARSE"}`);
  });

  // Identifikasi string yang tidak bisa diparsing
  const gagal = docs.filter((d) => !parseJakartaDate(d.tanggal));
  if (gagal.length > 0) {
    warn(`${gagal.length} dokumen dengan format tanggal tidak dikenal:`);
    gagal.forEach((d) => warn(`  _id: ${d._id} | tanggal: "${d.tanggal}"`));
    warn("Dokumen ini TIDAK akan dimigrasi. Perbaiki manual setelah migrasi.");
  }

  if (IS_DRY_RUN) {
    printResult(docs.length, 0);
    return;
  }

  // Eksekusi update satu per satu (untuk presisi konversi per dokumen)
  let modified = 0;
  for (const doc of docs) {
    const parsed = parseJakartaDate(doc.tanggal);
    if (!parsed) continue;
    await collection.updateOne(
      { _id: doc._id },
      { $set: { tanggal: parsed } }
    );
    modified++;
  }

  printResult(docs.length, modified);
}

// ============================================================================
// [M2] BankSoal.durasi → durasiMenit (rename field)
// ============================================================================
//
// IDEMPOTENT: Dokumen yang sudah punya durasiMenit (dan tidak punya durasi)
//             tidak akan tersentuh oleh $rename.
// ============================================================================

async function migrasiM2(db) {
  printHeader("M2", "BankSoal.durasi → durasiMenit (rename field)");

  const collection = db.collection("banksoals");

  // Hanya dokumen yang masih punya field "durasi" lama
  const matched = await collection.countDocuments({ durasi: { $exists: true } });
  log(`Dokumen dengan field "durasi" lama: ${matched}`);

  if (matched === 0) {
    ok("Tidak ada dokumen yang perlu dimigrasi. Lewat.");
    return;
  }

  if (IS_DRY_RUN) {
    printResult(matched, 0);
    return;
  }

  const result = await collection.updateMany(
    { durasi: { $exists: true } },
    { $rename: { durasi: "durasiMenit" } }
  );

  printResult(result.matchedCount, result.modifiedCount);
}

// ============================================================================
// [M3] BankSoal.kodeCabang — Tambah field baru
// ============================================================================
//
// Strategi: semua dokumen lama diberi kodeCabang = DEFAULT_KODE_CABANG (CPT).
// Admin harus memverifikasi dan mengkoreksi bank soal yang bukan milik CPT.
//
// IDEMPOTENT: Hanya dokumen yang belum punya kodeCabang yang diupdate.
// ============================================================================

async function migrasiM3(db) {
  printHeader("M3", `BankSoal.kodeCabang — Tambah field baru (default: "${DEFAULT_KODE_CABANG}")`);

  const collection = db.collection("banksoals");
  const matched    = await collection.countDocuments({ kodeCabang: { $exists: false } });
  log(`Dokumen tanpa kodeCabang: ${matched}`);

  if (matched === 0) {
    ok("Tidak ada dokumen yang perlu dimigrasi. Lewat.");
    return;
  }

  warn(`Semua ${matched} dokumen akan diberi kodeCabang = "${DEFAULT_KODE_CABANG}" (CPT).`);
  warn("Verifikasi manual diperlukan untuk bank soal dari cabang lain.");

  if (IS_DRY_RUN) {
    printResult(matched, 0);
    return;
  }

  const result = await collection.updateMany(
    { kodeCabang: { $exists: false } },
    { $set: { kodeCabang: DEFAULT_KODE_CABANG } }
  );

  printResult(result.matchedCount, result.modifiedCount);
}

// ============================================================================
// [M4] Quiz.durasi → durasiMenit (rename field)
// ============================================================================

async function migrasiM4(db) {
  printHeader("M4", "Quiz.durasi → durasiMenit (rename field)");

  const collection = db.collection("quizzes");
  const matched    = await collection.countDocuments({ durasi: { $exists: true } });
  log(`Dokumen dengan field "durasi" lama: ${matched}`);

  if (matched === 0) {
    ok("Tidak ada dokumen yang perlu dimigrasi. Lewat.");
    return;
  }

  if (IS_DRY_RUN) {
    printResult(matched, 0);
    return;
  }

  const result = await collection.updateMany(
    { durasi: { $exists: true } },
    { $rename: { durasi: "durasiMenit" } }
  );

  printResult(result.matchedCount, result.modifiedCount);
}

// ============================================================================
// [M5] Quiz.kodeCabang — Tambah field baru
// ============================================================================

async function migrasiM5(db) {
  printHeader("M5", `Quiz.kodeCabang — Tambah field baru (default: "${DEFAULT_KODE_CABANG}")`);

  const collection = db.collection("quizzes");
  const matched    = await collection.countDocuments({ kodeCabang: { $exists: false } });
  log(`Dokumen tanpa kodeCabang: ${matched}`);

  if (matched === 0) {
    ok("Tidak ada dokumen yang perlu dimigrasi. Lewat.");
    return;
  }

  warn(`Semua ${matched} dokumen akan diberi kodeCabang = "${DEFAULT_KODE_CABANG}" (CPT).`);

  if (IS_DRY_RUN) {
    printResult(matched, 0);
    return;
  }

  const result = await collection.updateMany(
    { kodeCabang: { $exists: false } },
    { $set: { kodeCabang: DEFAULT_KODE_CABANG } }
  );

  printResult(result.matchedCount, result.modifiedCount);
}

// ============================================================================
// [M6] LatihanSoal.kodeCabang — Tambah field baru
// ============================================================================

async function migrasiM6(db) {
  printHeader("M6", `LatihanSoal.kodeCabang — Tambah field baru (default: "${DEFAULT_KODE_CABANG}")`);

  const collection = db.collection("latihansoals");
  const matched    = await collection.countDocuments({ kodeCabang: { $exists: false } });
  log(`Dokumen tanpa kodeCabang: ${matched}`);

  if (matched === 0) {
    ok("Tidak ada dokumen yang perlu dimigrasi. Lewat.");
    return;
  }

  warn(`Semua ${matched} dokumen akan diberi kodeCabang = "${DEFAULT_KODE_CABANG}" (CPT).`);

  if (IS_DRY_RUN) {
    printResult(matched, 0);
    return;
  }

  const result = await collection.updateMany(
    { kodeCabang: { $exists: false } },
    { $set: { kodeCabang: DEFAULT_KODE_CABANG } }
  );

  printResult(result.matchedCount, result.modifiedCount);
}

// ============================================================================
// [M7] Quiz.pembuatId null — Laporan & audit (tidak auto-fix)
// ============================================================================
//
// Quiz lama mungkin tidak punya pembuatId (field tidak required sebelumnya).
// Script ini HANYA melaporkan dokumen tersebut — tidak mengubah data,
// karena tidak mungkin menebak siapa pembuatnya secara otomatis.
//
// Tindakan: Admin harus mengisi pembuatId secara manual via MongoDB Compass
// atau script terpisah setelah verifikasi data.
// ============================================================================

async function migrasiM7(db) {
  printHeader("M7", "Quiz.pembuatId null — Audit & laporan (tidak auto-fix)");

  const collection = db.collection("quizzes");

  const docs = await collection
    .find(
      { $or: [{ pembuatId: null }, { pembuatId: { $exists: false } }] },
      { projection: { _id: 1, jadwalId: 1, namaPembuat: 1, createdAt: 1 } }
    )
    .toArray();

  if (docs.length === 0) {
    ok("Semua quiz sudah punya pembuatId. Tidak ada tindakan diperlukan.");
    return;
  }

  warn(`${docs.length} quiz tidak memiliki pembuatId:`);
  docs.forEach((d) => {
    warn(
      `  _id: ${d._id}` +
      ` | jadwalId: ${d.jadwalId}` +
      ` | namaPembuat: "${d.namaPembuat ?? "-"}"` +
      ` | createdAt: ${d.createdAt?.toISOString() ?? "-"}`
    );
  });

  warn("Tindakan: Isi pembuatId secara manual di MongoDB Compass.");
  warn("Query untuk menemukan dokumen ini:");
  warn('  db.quizzes.find({ $or: [{ pembuatId: null }, { pembuatId: { $exists: false } }] })');
}

// ============================================================================
// RUNNER UTAMA
// ============================================================================

async function main() {
  console.log("\n" + "=".repeat(60));
  log("Quantum Migration Script");
  log(`Mode     : ${IS_DRY_RUN ? "DRY-RUN (gunakan --run untuk eksekusi)" : "EKSEKUSI SUNGGUHAN"}`);
  log(`Filter   : ${ONLY_IDS ? ONLY_IDS.join(", ") : "Semua migrasi"}`);
  log(`Timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  if (!IS_DRY_RUN) {
    warn("⚠ PERINGATAN: Mode eksekusi aktif.");
    warn("Pastikan backup database sudah dilakukan sebelum melanjutkan.");
    console.log("");
    // Jeda 3 detik supaya operator bisa batalkan dengan Ctrl+C
    log("Memulai dalam 3 detik... (Ctrl+C untuk batalkan)");
    await new Promise((r) => setTimeout(r, 3000));
  }

  await connect();

  const db = mongoose.connection.db;

  const migrations = [
    { id: "M1", fn: migrasiM1 },
    { id: "M2", fn: migrasiM2 },
    { id: "M3", fn: migrasiM3 },
    { id: "M4", fn: migrasiM4 },
    { id: "M5", fn: migrasiM5 },
    { id: "M6", fn: migrasiM6 },
    { id: "M7", fn: migrasiM7 },
  ];

  const errors = [];

  for (const { id, fn } of migrations) {
    if (!shouldRun(id)) {
      log(`[${id}] Dilewati (tidak ada di --only filter).`);
      continue;
    }
    try {
      await fn(db);
    } catch (err) {
      error(`[${id}] Gagal:`, err.message);
      errors.push({ id, message: err.message });
    }
  }

  console.log("\n" + "=".repeat(60));

  if (errors.length > 0) {
    error("Migrasi selesai dengan error:");
    errors.forEach(({ id, message }) => error(`  [${id}] ${message}`));
  } else {
    ok("Semua migrasi selesai tanpa error.");
  }

  if (IS_DRY_RUN) {
    log("Ini adalah dry-run. Jalankan dengan --run untuk eksekusi sungguhan.");
  }

  console.log("=".repeat(60) + "\n");

  await disconnect();
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  error("Fatal error:", err.message);
  process.exit(1);
});
