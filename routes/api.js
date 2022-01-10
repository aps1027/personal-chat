const express = require("express");
const mongoose  = require('mongoose');
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");

//@desc API/Search User
//@route POST /api/user-search
router.post("/user-search", async (req, res) => {
  let key = req.body?.search_user;
  try {
    const users = key
      ? await User.find({
          displayName: { $regex: key, $options: "i" },
        })
      : [];
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err });
  }
});

//@desc API/Create or Update Chat Room
//@route POST /api/chat-room
router.post("/chat-room", async (req, res) => {
  let chatRoom = null;
  let targeTuser = req.body?.target_user;
  let currenTuser = req.body?.current_user;

  const members = [
    mongoose.Types.ObjectId(currenTuser),
    mongoose.Types.ObjectId(targeTuser),
  ];

  try {
    const room = await Room.findOne({ members: { $all: members } });
    if (room) {
      chatRoom = await Room.findOneAndUpdate(
        { _id: room._id },
        { createdAt: Date.now() },
        {
          new: true,
        }
      );
    } else {
      chatRoom = await Room.create({ members: members });
    }
    res.json(chatRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err });
  }
});
module.exports = router;
