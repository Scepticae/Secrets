//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

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
    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function (err) {
            if (!err) {
                res.render("secrets");
            }
            else {
                console.log(err);
            }
        });
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
                bcrypt.compare(password, found.password, function(err, result){
                    if(result === true){
                        res.render("secrets");
                    }
                    else{
                        res.send("The username ore password does not exist.");
                    }
                });
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