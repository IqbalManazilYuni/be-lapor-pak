import express from "express";
import KabupatenKota from "../models/KabupatenKota.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const kabupatenKota = await KabupatenKota.find();
    return res
      .status(200)
      .json({ code: 200, status: "success", payload: kabupatenKota });
  } catch (error) {
    return res
      .status(500)
      .json({ code: 500, status: "error", message: error.message });
  }
});

router.post("/", async (req, res) => {
  const kabupatenKota = new KabupatenKota({
    kabupatenkota: req.body.kabupatenkota,
  });

  try {
    const newUser = await kabupatenKota.save();
    return res.status(201).json({
      code: 201,
      status: "success",
      message: "Kabupaten / Kota Berhasil Ditambahkan",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ code: 500, status: "error", message: error.message });
  }
});

router.put("/", async (req, res) => {
  const { _id, kabupatenkota } = req.body;
  try {
    const updatedkabupatenKota = await KabupatenKota.findByIdAndUpdate(_id, {
      kabupatenkota,
    });
    if (!updatedkabupatenKota) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Kabupaten / Kota tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Kabupaten / Kota berhasil diperbarui",
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
    const deletedkabupatenKota = await KabupatenKota.findByIdAndDelete(id);
    if (!deletedkabupatenKota) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Kabupaten / Kota tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Kabupaten / Kota berhasil diHapus",
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
