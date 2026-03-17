import mongoose from "mongoose";

// ============================================================================
// 1. PENGATURAN ENVIRONMENT
// ============================================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "❌ [Kritis]: Alamat MONGODB_URI belum dipasang di file .env.local!"
  );
}

// ============================================================================
// 2. GLOBAL CONNECTION CACHING (Anti-Bocor Koneksi Serverless)
// ============================================================================

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// ============================================================================
// 3. SISTEM RADAR DATABASE (Event Listeners)
// ============================================================================
if (mongoose.connection.listeners('disconnected').length === 0) {
  mongoose.connection.on('connected', () => {
    console.log('🟢 [MongoDB Radar]: Terhubung ke cluster database.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('🔴 [MongoDB Radar]: Gangguan sinyal database!', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('🟡 [MongoDB Radar]: Koneksi database terputus. Menunggu sambungan ulang...');
  });
}

// ============================================================================
// 4. FUNGSI KONEKSI UTAMA
// ============================================================================
async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);

    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        console.log("✅ [Database] MongoDB Quantum Berhasil Mengunci Target!");
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("❌ [Database] Gagal Terhubung:", error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; 
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;