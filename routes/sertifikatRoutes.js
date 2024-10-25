import express from "express";
import multer from "multer";
import path from "path";
import Sertifikat from "../models/Sertifikat.js";
import { protect } from "../middleware/authMiddleware.js";
// import sharp from "sharp";
// import poppler from "pdf-poppler";
import storage from "../config/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const router = express.Router();

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join("public", "file_sertifikat"));
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "application/pdf") {
//     cb(null, true);
//   } else {
//     cb(new Error("File harus berupa PDF"), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 3 * 1024 * 1024,
//   },
// });
// async function createThumbnail(pdfPath, outputPath) {
//   try {
//     const outputBase = path.basename(outputPath, ".png");

//     const opts = {
//       format: "png",
//       out_dir: path.dirname(outputPath),
//       out_prefix: outputBase,
//       page: 1,
//     };
//     await poppler.convert(pdfPath, opts);
//     const thumbnailFullPath = path.join(opts.out_dir, `${outputBase}-1.png`);
//     await sharp(thumbnailFullPath).resize(600, 400).toFile(outputPath);

//     console.log("Thumbnail berhasil dibuat:", outputPath);
//   } catch (error) {
//     console.error("Error saat membuat thumbnail:", error);
//   }
// }

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("File harus berupa PDF"), false);
    }
  },
});

const uploadToFirebase = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;
  const storageRef = ref(storage, `file_sertifikat/${fileName}`);

  const metadata = {
    contentType: file.mimetype,
    contentDisposition: "inline",
  };

  try {
    await uploadBytes(storageRef, file.buffer, metadata);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL; // URL ini bisa digunakan untuk preview langsung di browser
  } catch (error) {
    throw new Error("Gagal mengunggah file: " + error.message);
  }
};

router.post("/", protect, upload.single("file"), async (req, res) => {
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

    let fotoUrl = null;
    if (req.file) {
      fotoUrl = await uploadToFirebase(req.file); // Upload ke Firebase dan dapatkan URL
    }

    const newSertifikat = new Sertifikat({
      nama_sertifikat: `Sertifikat Pelapor Teraktif Bulan ${bulan} ${tahun}`,
      nama_pelapor: namaPelapor,
      tahun: tahun,
      bulan: bulan,
      status_notif: "tersampaikan",
      jumlahLaporan: jumlahLaporan,
      uri_pdf: fotoUrl,
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
    const sertifikatList = await Sertifikat.find();
    res.status(200).json({
      code: 200,
      status: "success",
      payload: sertifikatList
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((sertifikat) => ({
          _id: sertifikat._id,
          nama_pelapor: sertifikat.nama_pelapor,
          nama_sertifikat: sertifikat.nama_sertifikat,
          tahun: sertifikat.tahun,
          bulan: sertifikat.bulan,
          jumlahLaporan: sertifikat.jumlahLaporan,
          createdAt: sertifikat.createdAt,
          status_notif: sertifikat.status_notif,
          uri_pdf: sertifikat.uri_pdf,
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

router.put("/", protect, async (req, res) => {
  const { _id, status_notif } = req.body;
  console.log(status_notif);

  try {
    const updatedsertifikat = await Sertifikat.findByIdAndUpdate(_id, {
      status_notif,
    });
    if (!updatedsertifikat) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Sertifikat tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Sertifikat berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
});

export default router;
