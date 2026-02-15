const mongoose = require("mongoose");

const contactNoteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    page: { type: String, default: "", trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactNote", contactNoteSchema);
