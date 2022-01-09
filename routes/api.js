const express = require("express");
const router = express.Router();

const User = require("../models/User");

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

module.exports = router;
