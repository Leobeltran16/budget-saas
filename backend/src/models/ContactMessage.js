const mongoose = require("mongoose");

const ContactMessageSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    page: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", ContactMessageSchema);
