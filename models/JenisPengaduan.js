import mongoose from "mongoose";

const jenispengaduanSchema = new mongoose.Schema(
  {
    jenisPengaduan: {
      type: String,
      require: true,
    },
  },
  { collection: "jenis-pengaduan", timestamps: true }
);

const JenisPengaduan = mongoose.model("JenisPengaduan", jenispengaduanSchema);
export default JenisPengaduan;
