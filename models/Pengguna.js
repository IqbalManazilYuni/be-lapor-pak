import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const penggunaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    nomor_hp: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: "masyarakat",
    },
    addres: {
      type: String,
      required: true,
    },
    uri_profile: {
      type: String,
      required: false,
    },
    token: {
      type: String,
      required: false,
      default: null,
    },
  },
  { collection: "penggunas", timestamps: true }
);

penggunaSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

penggunaSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Pengguna = mongoose.model("Pengguna", penggunaSchema);
export default Pengguna;
