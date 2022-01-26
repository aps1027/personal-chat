const mongoose = require("mongoose");

const NotiSchema = new mongoose.Schema({
  type: {
    type: Number,
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  isSeen: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Noti", NotiSchema);
