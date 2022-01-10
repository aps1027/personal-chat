const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  members: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
