import mongoose from "mongoose";

// ============================================================================
// 1. VALIDASI ENVIRONMENT
// ============================================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("[db] MONGODB_URI is not defined. Add it to your .env.local file.");
}

// ============================================================================
// 2. GLOBAL CONNECTION CACHE
// ============================================================================

let cached = global.mongoose ?? (global.mongoose = { conn: null, promise: null });

// ============================================================================
// 3. EVENT LISTENERS
// ============================================================================
if (mongoose.connection.listeners("disconnected").length === 0) {
  mongoose.connection.on("connected",    ()    => console.log("[db] Connected to MongoDB."));
  mongoose.connection.on("error",        (err) => console.error("[db] Connection error:", err.message));
  mongoose.connection.on("disconnected", ()    => console.warn("[db] Disconnected from MongoDB."));
}

// ============================================================================
// 4. OPSI KONEKSI
// ============================================================================
const CONNECTION_OPTIONS = {
  bufferCommands: false,
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

// ============================================================================
// 5. FUNGSI KONEKSI UTAMA
// ============================================================================
/**
 * @returns {Promise<typeof mongoose>}
 */
async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, CONNECTION_OPTIONS)
      .then((instance) => {
        console.log("[db] MongoDB connection established.");
        return instance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("[db] Failed to connect to MongoDB:", error.message);
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