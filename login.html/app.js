const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } 
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "/auth/linkedin/callback",
    scope: ['r_liteprofile', 'r_emailaddress']
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/services');
});

app.get('/auth/facebook', passport.authenticate('facebook', {
  scope: ['email']
}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/services');
});

app.get('/auth/linkedin', passport.authenticate('linkedin', {
  scope: ['r_liteprofile', 'r_emailaddress']
}));

app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/services');
});

app.get('/services', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Hello ${req.user.displayName}, welcome to services!`);
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.send('Please log in using Google, Facebook, or LinkedIn.');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
