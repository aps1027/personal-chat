const express = require("express");
const router = express.Router();
const { ensureAuth, ensureGuest } = require("../middleware/auth");

const User = require("../models/User");
const Room = require("../models/Room");

//@desc Login/Landing page
//@route GET /
router.get("/", ensureGuest, (req, res) => {
  res.render("login", {
    layout: "login",
  });
});

//@desc Dashboard
//@route GET /dashboard
router.get("/dashboard", ensureAuth, async (req, res) => {
  res.render("dashboard", {
    id: req.user._id,
    name: req.user.displayName,
    image: req.user.image,
  });
});

//@desc Chat
//@route GET /chat
router.get("/chat/:targetId", ensureAuth, async (req, res) => {
  try {
    const tragetUser = await User.findOne({
      _id: req.params.targetId,
    }).lean();
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
    res.render("chat", {
      id: req.user._id,
      name: req.user.displayName,
      image: req.user.image,
      rooms: rooms,
      targetId: req.params.targetId,
      targetName: tragetUser.displayName,
      targetImage: tragetUser.image,
    });
  } catch (err) {
    console.error(err);
    res.render("error/500");
  }
});

module.exports = router;
