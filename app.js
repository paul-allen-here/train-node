//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');

const session = require("express-session");
//const passport = require("passport");

const md5 = require("md5");

const homeStartingContent = "Simple blog app.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices.";

const app = express();

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = "mongodb+srv://vova:"+ process.env.BD_PASS +"@bloglvluptest-iyvhk.mongodb.net/blog_base?retryWrites=true&w=majority";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true }).then(
  () => {console.log("DB Connected")},
  () => {console.error(err)}
);

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema ({
  title: String,
  content: String,
  by: String,
  time: String
});

const Post = mongoose.model("Post", postSchema);

app.use(session({
  secret: 'secretIsHere',
  resave: true,
  saveUninitialized: false,
}))

app.get("/", (req, res) => {

  let truePosts = [];

  Post.find({}, (err, returnedPosts) => {
    if (err) {
      console.log(err);
      res.render("404", {session: req.session.name});
    } else {
      console.log(returnedPosts);
      for (post of returnedPosts) {
        shortContent = _.truncate(post.content, {'length': 120});
    
        truePosts.push({ 
          title : post.title,
          content : shortContent,
          by : post.by,
          time : post.time
         })
      }
    
      res.render("home", {
        session: req.session.name,
        homeContent: homeStartingContent,
        homePosts: truePosts
      });
    }
  })

});

app.get("/post/:post_id", (req, res) => {

  let post_name = req.params.post_id;
  let found = false;
  let actualPost = {};

  Post.find({}, (err, returnedPosts) => {
    if (err) {
      console.log("Can't get any posts!");
      res.render("404", {session: req.session.name});
    } else {

      for (post of returnedPosts) {
        console.log(post.title);
        if (_.kebabCase(post.title) == _.kebabCase(post_name)) {
          actualPost = post;
          found = true;
        }
      }
      if (found) {
        console.log("Matched");
        res.render("post", {
          session: req.session.name,
          postTitle: actualPost.title,
          postContent: actualPost.content,
          postBy: actualPost.by,
          postTime: actualPost.time
        });
      }
      else {
        console.log("No matches found");
        res.render("404", {session: req.session.name});
      }
    }
  })

});

app.get("/register", (req, res) => {
  res.render("register", {session: req.session.name});
});

app.post("/register", (req, res) => {

  console.log(req.body.username);
  console.log(req.body.email);
  console.log(req.body.password);

  const newUser = new User ({
    name: req.body.username,
    email: req.body.email,
    password: md5(process.env.SECRET + req.body.password)
  });

  newUser.save();

  res.render("register", {session: req.session.name});
});

app.get("/login", (req, res) => {
  res.render("login", {session: req.session.name});
});

app.post("/login", (req, res) => {

  console.log(req.body.email);
  console.log(req.body.password);

  User.findOne({email: req.body.email}, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        console.log(foundUser);
        console.log("User founded!");

        if (foundUser.password === md5(process.env.SECRET + req.body.password)) {
          req.session.name = foundUser.name;
          res.redirect("/");
        } else {
          req.session.destroy();
          res.send("<h2>Password is invalid</h2><br /><a href = '/'>Homepage</a>");
        }
      } else {
        res.send("<h2>User not found</h2><br /><a href = '/'>Homepage</a>");
      }
    }
  });
});

app.get('/logout',(req,res) => {
  req.session.destroy((err) => {
      if (err) {
          return console.log(err);
      }
      res.redirect('/');
  });
});

app.get("/compose", (req, res) => {
  if (!req.session.name) {
    console.log("No session!");
    res.render("login", {session: req.session.name});
  } else {
    console.log("Founded session!");
    res.render("compose", {session: req.session.name});
  }
  
});

app.post("/compose", (req, res) => {
  
  console.log(req.body);

  const newPost = new Post ({
    title: req.body.postTitle,
    content: req.body.postContent,
    by: req.session.name,
    time: getDate()
  })

  newPost.save();

  res.redirect("/");
});

app.get("/about", (req, res) => {
  res.render("about", {
    session: req.session.name,
    aboutContent: aboutContent
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    session: req.session.name,
    contactContent: contactContent
  });
});

// app.set('port', process.env.PORT || 3000);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server for a blog started on port 3000");
});

const getDate = function () {
  const today = new Date();

  const options = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
  }
  
  return today.toLocaleDateString('en-US', options);
}
