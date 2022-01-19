const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");
const Message = require("../models/Message");

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

//@desc API/User By Id User
//@route GET /api/user/:id
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err });
  }
});

router.get("/chat-room", async (req, res) => {
  try {
    const rooms = await Room.aggregate([
      { $match: { members: req.user._id } },
      {
        $project: {
          members: {
            $filter: {
              input: "$members",
              as: "member",
              cond: {
                $ne: ["$$member", req.user._id],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members",
        },
      },
    ]);
    res.json(rooms);
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
    const tragetUser = await User.findOne({
      _id: mongoose.Types.ObjectId(targeTuser),
    }).lean();

    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 2);

    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const messages = await Message.find({
      room: mongoose.Types.ObjectId(chatRoom._id),
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });
    res.json({ room: chatRoom, user: tragetUser, messages: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err });
  }
});

//@desc API/Message By Room ID
//@route POST /api/room-message/:id
router.get("/room-message/:id", async (req, res) => {
  try {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const messages = await Message.find({
      room: mongoose.Types.ObjectId(req.params.id),
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err });
  }
});
module.exports = router;
