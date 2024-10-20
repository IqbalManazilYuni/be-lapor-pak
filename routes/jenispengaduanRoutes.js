import express from "express";
import JenisPengaduan from "../models/JenisPengaduan.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const jenispengaduan = await JenisPengaduan.find().sort({ createdAt: -1 });;
    return res
      .status(200)
      .json({ code: 200, status: "success", payload: jenispengaduan });
  } catch (error) {
    return res
      .status(500)
      .json({ code: 500, status: "error", message: error.message });
  }
});

router.post("/", async (req, res) => {
  const jenispengaduan = new JenisPengaduan({
    jenisPengaduan: req.body.jenisPengaduan,
  });

  try {
    const newUser = await jenispengaduan.save();
    return res.status(201).json({
      code: 201,
      status: "success",
      message: "Jenis Pengaduan Berhasil Ditambahkan",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ code: 500, status: "error", message: error.message });
  }
});

router.put("/", async (req, res) => {
  const { _id, jenisPengaduan } = req.body;
  console.log(jenisPengaduan);
  
  try {
    const updatedPengaduan = await JenisPengaduan.findByIdAndUpdate(_id, {
      jenisPengaduan,
    });
    if (!updatedPengaduan) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Jenis Pengaduan tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Jenis Pengaduan berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const deletedPengaduan = await JenisPengaduan.findByIdAndDelete(id);
    if (!deletedPengaduan) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Jenis Pengaduan tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Jenis Pengaduan berhasil diHapus",
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
