import express from "express";
import multer from "multer";
import path from "path";
import Sertifikat from "../models/Sertifikat.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join("public", "file_sertifikat"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa PDF"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { namaPelapor, tahun, bulan, jumlahLaporan } = req.body;

    const existingSertifikat = await Sertifikat.findOne({
      nama_pelapor: namaPelapor,
      tahun: tahun,
      bulan: bulan,
    });

    if (existingSertifikat) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Sertifikat dengan data yang sama sudah ada",
      });
    }

    const newSertifikat = new Sertifikat({
      nama_pelapor: namaPelapor,
      tahun: tahun,
      bulan: bulan,
      jumlahLaporan: jumlahLaporan,
      uri_pdf: req.file ? req.file.path : null,
    });

    await newSertifikat.save();

    res.status(201).json({
      code: 201,
      status: "success",
      message: "Sertifikat berhasil ditambahkan",
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: error.message,
      });
    }

    // Handle other errors
    res.status(500).json({
      code: 500,
      status: "error",
      message: "Terjadi kesalahan server",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const sertifikatList = await Sertifikat.find();
    res.status(200).json({
      code: 200,
      status: "success",
      payload: sertifikatList
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((sertifikat) => ({
          nama_pelapor: sertifikat.nama_pelapor,
          tahun: sertifikat.tahun,
          bulan: sertifikat.bulan,
          jumlahLaporan: sertifikat.jumlahLaporan,
          uri_pdf: `${req.protocol}://${req.get("host")}/${
            sertifikat.uri_pdf
          }`,
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

export default router;
