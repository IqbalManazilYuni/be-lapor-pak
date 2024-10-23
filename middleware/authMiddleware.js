import jwt from "jsonwebtoken";
import Pengguna from "../models/Pengguna.js";

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.pengguna = await Pengguna.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Token tidak valid, otorisasi gagal" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Tidak ada token, otorisasi gagal" });
  }
};
export { protect };
