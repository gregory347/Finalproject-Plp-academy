require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const cors = require("cors");
const path = require("path");
const mysql = require("mysql");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ["r_emailaddress", "r_liteprofile"],
      state: true,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/dashboard")
);

app.get("/auth/facebook", passport.authenticate("facebook"));
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/dashboard")
);

app.get("/auth/linkedin", passport.authenticate("linkedin"));
app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login" }),
  (req, res) => res.redirect("/dashboard")
);

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
};

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/dashboard", ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const runSqlScript = (file) => {
  const sql = fs.readFileSync(path.join(__dirname, "sql", file)).toString();
  connection.query(sql, (err) => {
    if (err) {
      console.error(`Failed to execute script ${file}:`, err.message);
    } else {
      console.log(`Executed script: ${file}`);
    }
  });
};

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
  } else {
    console.log("Connected to the database.");
    runSqlScript("create_users_table.sql");
    runSqlScript("create_services_table.sql");
  }
});
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
