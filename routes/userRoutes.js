import express from "express";
import Pengguna from "../models/Pengguna.js";
import generateToken from "../utils/generateToken.js";
import { protect } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Pengaduan from "../models/pengaduan.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await Pengguna.find()
      .select("-password")
      .sort({ createdAt: -1 }); // Mengurutkan berdasarkan createdAt yang terbaru
    return res
      .status(200)
      .json({ code: 200, status: "success", payload: users });
  } catch (error) {
    res.status(500).json({ code: 500, status: "error", message: error });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const akunpengguna = await Pengguna.findOne({ username });
    if (!akunpengguna) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ditemukan.",
      });
    }
    if (akunpengguna.role !== "masyarakat") {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ada akses",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      akunpengguna.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Password salah.",
      });
    }
    const token = jwt.sign(
      { id: akunpengguna._id, role: akunpengguna.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Login berhasil.",
      pengguna: {
        _id: akunpengguna._id,
        username: akunpengguna.username,
        name: akunpengguna.name,
        nomor_hp: akunpengguna.nomor_hp,
        addres: akunpengguna.addres,
        role: akunpengguna.role,
        uri_profle: `${req.protocol}://${req.get("host")}/${
          akunpengguna.uri_profile
        }`,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ code: 500, status: "error", message: error });
  }
});

router.post("/login/web", async (req, res) => {
  const { username, password } = req.body;
  try {
    const akunpengguna = await Pengguna.findOne({ username });
    if (!akunpengguna) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ditemukan.",
      });
    }
    if (akunpengguna.role === "masyarakat") {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ada akses",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      akunpengguna.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Password salah.",
      });
    }
    const token = jwt.sign(
      { id: akunpengguna._id, role: akunpengguna.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Login berhasil.",
      pengguna: {
        _id: akunpengguna._id,
        username: akunpengguna.username,
        name: akunpengguna.name,
        nomor_hp: akunpengguna.nomor_hp,
        addres: akunpengguna.addres,
        role: akunpengguna.role,
        uri_profle: `${req.protocol}://${req.get("host")}/${
          akunpengguna.uri_profile
        }`,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ code: 500, status: "error", message: error });
  }
});

router.post("/register", async (req, res) => {
  const { name, username, nomor_hp, addres, password, role } = req.body;

  try {
    const penggunaExist = await Pengguna.findOne({ username });
    if (penggunaExist) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Username Sudah Digunakan",
      });
    }
    await Pengguna.create({
      name,
      username,
      nomor_hp,
      addres,
      role,
      password,
    });
    return res.status(201).json({
      code: 201,
      status: "success",
      message: "Akun Berhasil Dibuat",
    });
  } catch (error) {
    return res.status(500).json({ code: 500, status: "error", message: error });
  }
});

router.put("/edit-pengguna", async (req, res) => {
  const { _id, name, username, nomor_hp, addres, role } = req.body;
  try {
    const namaPetugas = await Pengguna.findById(_id);
    const updatedPasswordPetugas = await Pengguna.findByIdAndUpdate(_id, {
      name,
      username,
      nomor_hp,
      addres,
      role,
    });
    if (!updatedPasswordPetugas) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna Tidak Ditemukan",
      });
    }
    const updatePengaduanPetugas = await Pengaduan.updateMany(
      { petugas: namaPetugas.username },
      { $set: { petugas: username } }
    );

    const updatePengaduanPelapor = await Pengaduan.updateMany(
      { nama_pelapor: namaPetugas.username },
      { $set: { nama_pelapor: username } }
    );

    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Pengguna berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
});

router.put("/edit-password", async (req, res) => {
  const { _id, password } = req.body;
  try {
    const updatedPasswordPetugas = await Pengguna.findByIdAndUpdate(_id, {
      password,
    });

    if (!updatedPasswordPetugas) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna Tidak Ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Password Pengguna berhasil diperbarui",
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: "error",
      message: error.message,
    });
  }
});

router.delete("/delete-pengguna/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedkabupatenKota = await Pengguna.findByIdAndDelete(id);
    if (!deletedkabupatenKota) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ditemukan",
      });
    }
    return res.status(200).json({
      code: 200,
      status: "success",
      message: "Pengguna berhasil Di Hapus",
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
