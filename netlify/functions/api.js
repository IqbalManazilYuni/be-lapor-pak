import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
import userRoutes from "./routes/userRoutes.js";
import jenispengaduanRoutes from "./routes/jenispengaduanRoutes.js";
import kabupatenkotaRoutes from "./routes/kabupatenkotaRoutes.js";
import pengaduanRoutes from "./routes/pengaduanRoutes.js";
import sertifikatRoutes from "./routes/sertifikatRoutes.js";
import serverless from "serverless-http";
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

// Melayani file statis dari folder 'public/foto_pengaduan'
app.use(
  "/public/foto_pengaduan",
  express.static(path.join(path.resolve(), "public", "foto_pengaduan"))
);

app.use(
  "/public/thumbnails",
  express.static(path.join(path.resolve(), "public", "thumbnails"))
);

app.use(
  "/public/file_sertifikat",
  express.static(path.join(path.resolve(), "public", "file_sertifikat"))
);

app.use(
  "/public/foto_profile",
  express.static(path.join(path.resolve(), "public", "foto_profile"))
);

// Routes
app.use("/api/pengguna", userRoutes);
app.use("/api/jenispengaduan", jenispengaduanRoutes);
app.use("/api/kabupatenkota", kabupatenkotaRoutes);
app.use("/api/pengaduan", pengaduanRoutes);
app.use("/api/sertifikat", sertifikatRoutes);

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
export const handler = serverless(app);
