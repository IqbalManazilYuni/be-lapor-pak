import mongoose from "mongoose";

const kabupatenkotaSchema = new mongoose.Schema(
  {
    kabupatenkota: {
      type: String,
      require: true,
      unique: true,
    },
  },
  { collection: "kabupaten-kota", timestamps: true }
);

const KabupatenKota = mongoose.model("KabupatenKota", kabupatenkotaSchema);
export default KabupatenKota;
