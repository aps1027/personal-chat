const express = require("express");
const res = require("express/lib/response");
const { model } = require("mongoose");
const passport = require("passport");
const router = express.Router();

//@desc Auth with Google
//@route GET /auth/google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);

//@desc Google auth callback
//@route GET /auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/personal-chat");
  }
);

// @desc Logout user
// @route /auth/logout
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
