import express from "express";
import ServerlessHttp from "serverless-http";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/db.js";
import path from "path";
import userRoutes from "../routes/userRoutes.js";
import jenispengaduanRoutes from "../routes/jenispengaduanRoutes.js";
import kabupatenkotaRoutes from "../routes/kabupatenkotaRoutes.js";
import pengaduanRoutes from "../routes/pengaduanRoutes.js";
import sertifikatRoutes from "../routes/sertifikatRoutes.js";

// Load environment variables
dotenv.config();

// Koneksi ke database
connectDB();

// Inisialisasi express
const app = express();

// Middleware untuk parsing JSON
app.use(express.json());

// Konfigurasi CORS
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
};
app.use(cors(corsOptions));

// Melayani file statis
const __dirname = path.resolve();

app.use(
  "/public/foto_pengaduan",
  express.static(path.join(__dirname, "public", "foto_pengaduan"))
);
app.use(
  "/public/thumbnails",
  express.static(path.join(__dirname, "public", "thumbnails"))
);
app.use(
  "/public/file_sertifikat",
  express.static(path.join(__dirname, "public", "file_sertifikat"))
);
app.use(
  "/public/foto_profile",
  express.static(path.join(__dirname, "public", "foto_profile"))
);

// Routes
app.use("/api/pengguna", userRoutes);
app.use("/api/jenispengaduan", jenispengaduanRoutes);
app.use("/api/kabupatenkota", kabupatenkotaRoutes);
app.use("/api/pengaduan", pengaduanRoutes);
app.use("/api/sertifikat", sertifikatRoutes);

// Test route
app.get("/.netlify/functions/api", (req, res) => {
  res.json({ message: "Hello World" });
});

// Export the handler
const handler = ServerlessHttp(app);

module.exports.handler = async (event, context) => {
  const result = await handler(event, context);
  return result;
};
