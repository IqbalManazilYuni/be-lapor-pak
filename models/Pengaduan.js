// models/pengaduan.js
import mongoose from "mongoose";

const pengaduanSchema = new mongoose.Schema(
  {
    judul: {
      type: String,
      required: true,
    },
    nama_pelapor: {
      type: String,
      required: true,
    },
    tanggal: {
      type: String,
      required: true,
    },
    jenis_pengaduan: {
      type: String,
      required: true,
    },
    kabupatenkota: {
      type: String,
      required: true,
    },
    petugas: {
      type: String,
      required: false,
      default: "",
    },
    status: {
      type: String,
      required: false,
      default: "menunggu",
    },
    uri_foto: {
      type: String,
      required: true,
    },
    lokasi: {
      type: String,
      required: true,
    },
    deskripsi: {
      type: String,
      required: true,
    },
  },
  { collection: "pengaduan", timestamps: true }
);

const Pengaduan = mongoose.model("Pengaduan", pengaduanSchema);
export default Pengaduan;
