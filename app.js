require("dotenv").config();
// console.log(process.env.GOOGLE_MAPS_API_KEY);


// =======================
// IMPORT DEPENDENCIES
// =======================


// Core
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
const MongoStore=require("connect-mongo").default;
const flash = require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local").Strategy;
const User=require("./models/user.js");

// Utilities
const ExpressError = require("./utils/ExpressError.js");


// =======================
// CONFIGURATION
// =======================

const PORT = 2121;
// const MONGO_URL = "mongodb://127.0.0.1:27017/WanderLust";
const DB_URL=process.env.ATLASDB_URL;
// console.log(DB_URL);

// =======================
// DATABASE CONNECTION
// =======================

mongoose.connect(DB_URL)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ MongoDB Error:", err));


// =======================
// APP SETTINGS
// =======================

// View engine
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");


// =======================
// GLOBAL MIDDLEWARES
// =======================

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Method override
app.use(methodOverride("_method"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Cookies
app.use(cookieParser("secretcode"));


// =======================
// SESSION CONFIG
// =======================

const store = MongoStore.create({
    mongoUrl: DB_URL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// app.get("/demouser",async(req,res)=>{
//     let fakeuser=new User({
//         email:"anonymous@gmail.com",
//         username:"delta-student"
//     });
//     let registeredUser= await User.register(fakeuser,"password");
//     res.send(registeredUser);
// })
// =======================
// FLASH MIDDLEWARE
// =======================

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser=req.user;
    next();
});

// Routers
const listingsRouter = require("./routes/listing.js");
const reviewsRouter= require("./routes/review.js");
const userRouter=require("./routes/user.js");

// =======================
// ROUTES
// =======================
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// =======================
// COOKIE ROUTES (TESTING)
// =======================

// Send cookies
app.get("/getcookies", (req, res) => {
    res.cookie("greet", "Namaste");
    res.cookie("madeIn", "India");
    res.send("Cookies sent");
});

// Signed cookies
app.get("/getSignedCookies", (req, res) => {
    res.cookie("made-In", "India", { signed: true });
    res.send("Signed cookie sent");
});

app.get("/verify", (req, res) => {
    console.log(req.signedCookies);
    res.send("Verified");
});

app.get("/greet", (req, res) => {
    let { name = "anonymous" } = req.cookies;
    res.send(`Hi hello ${name}`);
});


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
