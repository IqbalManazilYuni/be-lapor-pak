import express from "express";
import Pengaduan from "../models/Pengaduan.js";
import multer from "multer";
import path from "path";
import moment from "moment";
import "moment/locale/id.js";
import { protect } from "../middleware/authMiddleware.js";
import storage from "../config/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File harus berupa gambar"), false);
    }
  },
});

// Fungsi untuk mengunggah file ke Firebase Storage
const uploadToFirebase = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;
  const storageRef = ref(storage, `foto_pengaduan/${fileName}`);

  try {
    // Upload file ke Firebase Storage
    await uploadBytes(storageRef, file.buffer);
    // Dapatkan URL publik file
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    throw new Error("Gagal mengunggah file: " + error.message);
  }
};

router.post("/", protect, upload.single("photo"), async (req, res) => {
  try {
    const {
      judul_pengaduan,
      deskripsi,
      tanggal,
      pelapor,
      lokasi,
      kabupatenkota,
      jenispengaduan,
    } = req.body;

    let fotoUrl = null;
    if (req.file) {
      fotoUrl = await uploadToFirebase(req.file); // Upload ke Firebase dan dapatkan URL
    }

    const newPengaduan = new Pengaduan({
      judul: judul_pengaduan,
      deskripsi: deskripsi,
      nama_pelapor: pelapor,
      tanggal: tanggal,
      jenis_pengaduan: jenispengaduan,
      kabupatenkota: kabupatenkota,
      lokasi: lokasi,
      uri_foto: fotoUrl,
    });

    await newPengaduan.save();

    res.status(201).json({
      code: 201,
      status: "success",
      message: "Pengaduan berhasil ditambahkan",
      data: newPengaduan,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const pengaduanList = await Pengaduan.find();
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Data pengaduan berhasil diambil",
      payload: pengaduanList
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Urutkan dari terbaru ke terlama
        .map((pengaduan) => ({
          _id: pengaduan._id,
          judul: pengaduan.judul,
          deskripsi: pengaduan.deskripsi,
          nama_pelapor: pengaduan.nama_pelapor,
          tanggal: pengaduan.tanggal,
          jenis_pengaduan: pengaduan.jenis_pengaduan,
          kabupatenkota: pengaduan.kabupatenkota,
          lokasi: pengaduan.lokasi,
          status: pengaduan.status,
          petugas: pengaduan.petugas,
          uri_foto: pengaduan.uri_foto,
        })),
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Terjadi kesalahan server",
      status: "error",
      error: error.message,
    });
  }
});

router.put("/petugas", protect, async (req, res) => {
  const { _id, status, petugas } = req.body;
  try {
    const updatedPasswordPetugas = await Pengaduan.findByIdAndUpdate(_id, {
      status,
      petugas,
    });

    if (!updatedPasswordPetugas) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengaduan Tidak Ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Pengaduan berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
});

router.delete("/hapus-pengaduan/:id", protect, async (req, res) => {
  const { id } = req.params;
  try {
    const deletedkabupatenKota = await Pengaduan.findByIdAndDelete(id);
    if (!deletedkabupatenKota) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengaduan tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Pengaduan berhasil Di Hapus",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const pengaduanList = await Pengaduan.find();
    const summary = {};

    pengaduanList.forEach((pengaduan) => {
      const tanggalPengaduan = new Date(pengaduan.createdAt);
      const bulan = moment(tanggalPengaduan).format("MMMM");
      const tahun = moment(tanggalPengaduan).format("YYYY");
      if (!summary[tahun]) {
        summary[tahun] = {};
      }
      if (!summary[tahun][bulan]) {
        summary[tahun][bulan] = {};
      }
      if (!summary[tahun][bulan][pengaduan.nama_pelapor]) {
        summary[tahun][bulan][pengaduan.nama_pelapor] = 0;
      }
      summary[tahun][bulan][pengaduan.nama_pelapor] += 1;
    });
    const summaryResult = Object.keys(summary).map((tahun) => {
      return {
        tahun,
        bulan: Object.keys(summary[tahun]).map((bulan) => ({
          bulan,
          pelapor: Object.keys(summary[tahun][bulan]).map((namaPelapor) => ({
            namaPelapor,
            jumlahLaporan: summary[tahun][bulan][namaPelapor],
          })),
        })),
      };
    });
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Summary pengaduan berhasil diambil",
      payload: summaryResult,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Terjadi kesalahan server",
      status: "error",
      error: error.message,
    });
  }
});

export default router;
