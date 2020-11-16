//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Important to place session code here
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Database Setup
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

//New Mongodb schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Creates new mongodb model for schema
const User = new mongoose.model("User", userSchema);

//Allows for session info to be packed and unpacked
passport.use(User.createStrategy());
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

//Setup Oauth2.0
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/secrets",
    passport.authenticate("google", {failureRedirect: "/login"}),
    function(req, res){
        res.redirect("/secrets");
    }
);

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

//Creates the post to register route
app.post("/register", function(req, res){
     User.register({username: req.body.username}, req.body.password, function(err, user){
         if(err){
            console.log(err);
            res.redirect("/register");
         }
         else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
         }
     });
});

//Creates post to login route and validates username and password
app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //Authenticate user
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});



app.listen(3000, function(){
    console.log("Server running on port 3000.");
});