const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const { engine } = require("express-handlebars");
const methodOverride = require("method-override");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

// Load config
dotenv.config({ path: "./config/config.env" });

// Passport congfig
require("./config/passport")(passport);

connectDB();

const app = express();
const server = http.createServer(app);

const User = require("./models/User");
const Room = require("./models/Room");
const Message = require("./models/Message");

const io = new Server(server);
io.on("connection", (socket) => {
  socket.on("user connect", async ({ user_id }) => {
    socket.user_id = user_id;
    await User.findByIdAndUpdate(user_id, { connected: true });
    socket.join(user_id);
    socket.broadcast.emit("user connected", {user: socket.user_id});
  });

  socket.on("select room", async ({ room_id }) => {
    socket.join(room_id);
  });

  socket.on("send message", async ({ message, roomId, from, to }) => {
    socket.to(roomId).emit("private message", {
      message,
      from,
      roomId,
    });
    Message.create({
      text: message,
      from: mongoose.Types.ObjectId(from),
      room: mongoose.Types.ObjectId(roomId),
    });

    let targetUser = await User.findOne({
      _id: mongoose.Types.ObjectId(from),
    }).lean();

    let targetRoom = await Room.findOne({
      _id: mongoose.Types.ObjectId(roomId),
    }).lean();

    socket
      .to(to)
      .emit("show noti", { room: targetRoom, user: targetUser, noti: true });
  });

  socket.on("disconnect", async () => {
    if (socket.user_id) {
      await User.findByIdAndUpdate(socket.user_id, { connected: false });
      socket.broadcast.emit("user disconnected", {user: socket.user_id});
    }
    console.log("user disconnected");
  });
});

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Handlebars Helpers
const {
  formatDate,
  truncate,
  stripTags,
  editIcon,
  select,
} = require("./helpers/hbs");

// Handlebars
app.engine(
  ".hbs",
  engine({
    helpers: { formatDate, truncate, stripTags, editIcon, select },
    defaultLayout: "main",
    extname: ".hbs",
  })
);
app.set("view engine", ".hbs");

// Sessions
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.MONGO_DB_NAME,
    }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});

// Static folder
app.use(express.static(path.join(__dirname, "public")));

/* Redirect http to https */
app.get("*", function (req, res, next) {
  if (
    "https" !== req.headers["x-forwarded-proto"] &&
    "production" === process.env.NODE_ENV
  ) {
    res.redirect("https://" + req.hostname + req.url);
  } else {
    // Continue to other routes if we're not redirecting
    next();
  }
});

// Routes
app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/api", require("./routes/api"));

const PORT = process.env.PORT || 5000;
server.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
