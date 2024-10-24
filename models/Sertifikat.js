// models/pengaduan.js
import mongoose from "mongoose";

const sertifikatSchema = new mongoose.Schema(
  {
    nama_pelapor: {
      type: String,
      required: true,
    },
    tahun: {
      type: String,
      required: true,
    },
    nama_sertifikat: {
      type: String,
      required: false,
    },
    bulan: {
      type: String,
      required: true,
    },
    jumlahLaporan: {
      type: String,
      required: true,
    },
    uri_pdf: {
      type: String,
      required: true,
    },
    uri_thumbnail: {
      type: String,
      required: false,
    },
    status_notif: {
      type: String,
      require: false,
    },
  },
  { collection: "sertifikat", timestamps: true }
);

const Sertifikat = mongoose.model("Sertifikat", sertifikatSchema);
export default Sertifikat;
