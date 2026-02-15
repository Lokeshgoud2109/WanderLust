require("dotenv").config();

// =======================
// IMPORT DEPENDENCIES
// =======================

const express = require("express");
const app = express();
const path = require("path");

// Database
const mongoose = require("mongoose");

// Middlewares
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Models & Utils
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");

// =======================
// CONFIGURATION
// =======================

const PORT = process.env.PORT || 2121;
const DB_URL = process.env.ATLASDB_URL;

// 🔥 REQUIRED FOR RENDER (IMPORTANT)
app.set("trust proxy", 1);

// =======================
// DATABASE CONNECTION
// =======================

mongoose
  .connect(DB_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// =======================
// APP SETTINGS
// =======================

app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");

// =======================
// GLOBAL MIDDLEWARES
// =======================

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser(process.env.SECRET));

// =======================
// SESSION STORE
// =======================

const store = MongoStore.create({
  mongoUrl: DB_URL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("❌ ERROR IN MONGO SESSION STORE", err);
});

// =======================
// SESSION CONFIG (RENDER FIX)
// =======================

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false, // ✅ REQUIRED
  cookie: {
    httpOnly: true,
    secure: true,           // ✅ REQUIRED FOR HTTPS (Render)
    sameSite: "none",       // ✅ REQUIRED WITH secure:true
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionOptions));
app.use(flash());

// =======================
// PASSPORT CONFIG
// =======================

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =======================
// FLASH & CURRENT USER (NAVBAR FIX)
// =======================

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // ✅ FIXES LOGIN / LOGOUT UI
  next();
});

// =======================
// ROUTES
// =======================

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// =======================
// 404 HANDLER
// =======================

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// =======================
// GLOBAL ERROR HANDLER
// =======================

app.use((err, req, res, next) => {
  const { status = 500 } = err;
  res.status(status).render("errors.ejs", { err });
});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});