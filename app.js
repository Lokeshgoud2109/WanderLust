require("dotenv").config();

// =======================
// IMPORTS
// =======================

const express = require("express");
const app = express();
const path = require("path");

const mongoose = require("mongoose");

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");
const MongoStore = require("connect-mongo");

const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

// Models & Utils
const User = require("./models/user");
const ExpressError = require("./utils/ExpressError");

// =======================
// BASIC CONFIG
// =======================

const PORT = process.env.PORT || 2121;
const DB_URL = process.env.ATLASDB_URL;
const SECRET = process.env.SECRET;

// 🔥 REQUIRED FOR RENDER HTTPS COOKIES
app.set("trust proxy", 1);

// =======================
// DATABASE
// =======================

mongoose
  .connect(DB_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// =======================
// VIEW ENGINE
// =======================

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =======================
// MIDDLEWARES
// =======================

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// =======================
// SESSION STORE
// =======================

const store = MongoStore.create({
  mongoUrl: DB_URL,
  crypto: {
    secret: SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", e => {
  console.log("❌ SESSION STORE ERROR", e);
});

// =======================
// SESSION CONFIG (100% FIXED)
// =======================

app.use(
  session({
    name: "wanderlust.sid",
    store,
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // 🔥 ABSOLUTELY REQUIRED ON RENDER
    cookie: {
      httpOnly: true,
      secure: true,      // HTTPS only
      sameSite: "none",  // REQUIRED with secure:true
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(flash());

// =======================
// PASSPORT
// =======================

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =======================
// GLOBAL LOCALS
// =======================

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // 🔥 NAVBAR FIX
  next();
});

// =======================
// ROUTES
// =======================

const listingsRouter = require("./routes/listing");
const reviewsRouter = require("./routes/review");
const userRouter = require("./routes/user");

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// =======================
// 404
// =======================

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// =======================
// ERROR HANDLER
// =======================

app.use((err, req, res, next) => {
  const { status = 500 } = err;
  res.status(status).render("errors", { err });
});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});