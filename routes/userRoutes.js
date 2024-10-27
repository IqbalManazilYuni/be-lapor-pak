import express from "express";
import Pengguna from "../models/Pengguna.js";
import generateToken from "../utils/generateToken.js";
import { protect } from "../middleware/authMiddleware.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Pengaduan from "../models/Pengaduan.js";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import storage from "../config/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import multer from "multer";
import Sertifikat from "../models/Sertifikat.js";

dotenv.config();

const router = express.Router();

router.get("/", protect, async (req, res) => {
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
      token,
    });
  } catch (error) {
    res.status(500).json({ code: 500, status: "error", message: error });
  }
});

router.post("/getuser-bytoken", protect, async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pengguna = await Pengguna.findById(decoded.id);
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Token berhasil didecode.",
      data: {
        name: pengguna.name,
        username: pengguna.username,
        id: pengguna.id,
        nomor_hp: pengguna.nomor_hp,
        "role:": pengguna.role,
        addres: pengguna.addres,
        uri_profle: pengguna.uri_profile,
      },
    });
  } catch (error) {
    res.status(401).json({
      code: 401,
      status: "error",
      message: "Token tidak valid atau telah kedaluwarsa.",
    });
  }
});

const decryptPassword = (encryptedPassword) => {
  const key = CryptoJS.enc.Utf8.parse(process.env.ENCRYPTION_KEY);
  const decrypted = CryptoJS.AES.decrypt(encryptedPassword, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8);
  return decrypted;
};

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
    const decryptedPassword = decryptPassword(password);
    const isPasswordValid = await bcrypt.compare(
      decryptedPassword,
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
      { expiresIn: "3600s" }
    );
    const expiry = Math.floor(Date.now() / 1000) + 3600;

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
      expiry,
    });
  } catch (error) {
    res.status(500).json({ code: 500, status: "error", message: error });
  }
});

router.post("/register", async (req, res) => {
  const { name, username, nomor_hp, addres, password, role } = req.body;
  try {
    const penggunaExist = await Pengguna.findOne({ username });
    const namaPengguna = await Pengguna.findOne({ name });
    if (namaPengguna) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Nama Sudah Digunakan",
      });
    }
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

const uploadToFirebase = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;
  const storageRef = ref(storage, `file_profile/${fileName}`);

  const metadata = {
    contentType: file.mimetype,
    contentDisposition: "inline",
  };

  try {
    await uploadBytes(storageRef, file.buffer, metadata);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    throw new Error("Gagal mengunggah file: " + error.message);
  }
};

router.put("/edit-pengguna", protect, async (req, res) => {
  const { _id, name, username, nomor_hp, addres, role } = req.body;
  try {
    const pengguna = await Pengguna.findById(_id);
    if (!pengguna) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ditemukan",
      });
    }

    if (username && pengguna.username !== username) {
      const penggunaExist = await Pengguna.findOne({ username });
      if (penggunaExist) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Username sudah digunakan",
        });
      }
    }

    const updatedPengguna = await Pengguna.findByIdAndUpdate(
      _id,
      { name, username, nomor_hp, addres, role },
      { new: true }
    );

    if (!updatedPengguna) {
      return res.status(404).json({
        code: 404,
        status: "error",
        message: "Pengguna tidak ditemukan saat pembaruan",
      });
    }

    if (username && pengguna.username !== username) {
      console.log("log username");
      
      await Pengaduan.updateMany(
        { petugas: pengguna.username },
        { $set: { petugas: username } }
      );
    }

    if (name && pengguna.name !== name) {
      console.log("log name");

      await Sertifikat.updateMany(
        { nama_pelapor: pengguna.name },
        { $set: { nama_pelapor: name } }
      );
      await Pengaduan.updateMany(
        { nama_pelapor: pengguna.name },
        { $set: { nama_pelapor: name } }
      );
    }

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

router.put("/edit-password", protect, async (req, res) => {
  const { _id, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password, salt);
    const updatedPasswordPetugas = await Pengguna.findByIdAndUpdate(_id, {
      password: hashpassword,
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

router.put("/edit-password-mobile", protect, async (req, res) => {
  const { _id, password, password_lama } = req.body;
  console.log(password_lama);

  try {
    const akunpengguna = await Pengguna.findOne({ _id });

    const isPasswordValid = await bcrypt.compare(
      password_lama,
      akunpengguna.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Password salah.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashpassword = await bcrypt.hash(password, salt);

    const updatedPasswordPetugas = await Pengguna.findByIdAndUpdate(_id, {
      password: hashpassword,
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

router.delete("/delete-pengguna/:id", protect, async (req, res) => {
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

router.put(
  "/edit-pengguna-mobile",
  protect,
  upload.single("photo"),
  async (req, res) => {
    const { _id, name, username, nomor_hp, addres, role } = req.body;

    try {
      // Cari pengguna berdasarkan ID
      const pengguna = await Pengguna.findById(_id);
      if (!pengguna) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "Pengguna tidak ditemukan",
        });
      }

      if (username && pengguna.username !== username) {
        const penggunaExist = await Pengguna.findOne({ username });
        if (penggunaExist) {
          return res.status(400).json({
            code: 400,
            status: "error",
            message: "Username sudah digunakan",
          });
        }
      }

      let uri_profile = pengguna.uri_profile;
      if (req.file) {
        uri_profile = await uploadToFirebase(req.file);
      }
      
      const updatedPengguna = await Pengguna.findByIdAndUpdate(
        _id,
        { name, username, nomor_hp, addres, role, uri_profile },
        { new: true }
      );

      if (!updatedPengguna) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "Pengguna tidak ditemukan saat pembaruan",
        });
      }

      // Update data di Pengaduan jika username atau name diubah
      if (username && pengguna.username !== username) {
        await Pengaduan.updateMany(
          { petugas: pengguna.username },
          { $set: { petugas: username } }
        );
      }

      if (name && pengguna.name !== name) {
        console.log("ayam");

        await Sertifikat.updateMany(
          { nama_pelapor: pengguna.name },
          { $set: { nama_pelapor: name } }
        );
        await Pengaduan.updateMany(
          { nama_pelapor: pengguna.name },
          { $set: { nama_pelapor: name } }
        );
      }

      // Response berhasil
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
  }
);

export default router;
