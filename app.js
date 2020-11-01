//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Database Setup
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

//New Mongodb schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


//Encrypts the secret string
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

//Creates new mongodb model for schema
const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

//Creates the post to register route
app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        }
        else{
            console.log(err);
        }
    });
});

//Creates post to login route and validates username and password
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    //Check for matching username and password
    User.findOne({email: username}, function(err, found){
        if(err){
            console.log(err);
        }
        else{
            if(found){
                if(found.password === password){
                    res.render("secrets");
                }
                else{
                    res.send("That username or password does not exist");
                }
            }
            else{
                res.send("That username or password does not exist");
            }
        }
    });
});



app.listen(3000, function(){
    console.log("Server running on port 3000.");
});