//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const jwt = require('jsonwebtoken');
const faker = require('faker');
//const mongoose = require('mongoose');
const _ = require("lodash");
const ejs = require("ejs");
const md5 = require("md5");


const bd = require(__dirname + "/bd"); //BD FUNCTIONS.

const session = require("express-session");
//const passport = require("passport");

const PORT = process.env.PORT || 5000;
const app = express();

const homeStartingContent = "Simple blog app.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien.";
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: 'secretIsHere',
  resave: true,
  saveUninitialized: false,
}))


app.get("/createposts", (req, res) => {
  console.log(req.session.email);
  if (req.session.email) {
    const composedPost = {
      id : _.kebabCase(req.body.postTitle),
      title : faker.lorem.findName(),
      content : faker.lorem.sentence(),
      by : req.session.name,
      time : getDate(),
      creator_id: req.session.email
    }
    bd.composePost(composedPost).then(() => {
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

app.get("/", (req, res) => {

  let page = req.params.post_id;
  console.log(req.params.page);

  if (!page) {
    page = 1;
  }

  bd.getPosts(page).then((posts) => {
    if (!posts ) {
        res.render("404", {session: req.session.email});
    }
    if (posts.length < 1) {
      res.render("home", {
        session: req.session.email,
        homeContent: homeStartingContent,
        homePosts: []
      });
    } else {
      res.render("home", {
        session: req.session.email,
        homeContent: homeStartingContent,
        homePosts: posts
      });
    }
  });
});

app.get("/post/:post_id", (req, res) => {
  let post_id = req.params.post_id;
  console.log(post_id);
  bd.getOnePost(post_id).then((post) => {
    if (!post) {
        res.render("404", {session: req.session.email});
    } else {
      console.log(post);
      if (post.id === post_id) { 
        res.render("post", {
          id: post_id,
          session: req.session.email,
          postTitle: post.title,
          postContent: post.content,
          postBy: post.by,
          postTime: post.time,
          createdBy: post.creator_id,
          token: req.session.token
        });
      }
    }
  });
});

app.post("/post/delete/:post_id", (req, res) => {
  let post_id = req.params.post_id;
  try {
    let decoded = jwt.verify(req.body.secret, process.env.SECRET)
  } catch(err) {
    res.render("404", {
      session: req.session.email
    });
  }
  bd.deletePost(post_id).then(() => {
    res.redirect("/");
  });
});

app.get("/compose", (req, res) => {
  if (!req.session.email) {
    console.log("No session!");
    res.render("login", {
      session: req.session.email
    });
  } else {
    console.log("Founded session!");
    res.render("compose", {session: req.session.email});
  }
});

app.post("/compose", (req, res) => {
  console.log(req.body);
  const composedPost = {
    id : _.kebabCase(req.body.postTitle),
    title : req.body.postTitle,
    content : req.body.postContent,
    by : req.session.name,
    time : getDate(),
    creator_id: req.session.email
  }
  bd.composePost(composedPost).then(() => {
    res.redirect("/");
  });
});

app.get("/register", (req, res) => {
  res.render("register", {session: req.session.email});
});

app.post("/register", (req, res) => {
  const user = {
    name: req.body.username,
    email: req.body.email,
    password: md5(process.env.SECRET + req.body.password)
  };
  bd.registerUser(user).then(() => {
    res.render("login", {session: req.session.email});
  });
});

app.get("/login", (req, res) => {
  res.render("login", {session: req.session.email});
});

app.post("/login", (req, res) => {

  let email = req.body.email;

  bd.loginUser(email).then((user) => {
    if (!user) {
        res.render("404", {session: req.session.email});
    } else {
      console.log(user);
      if (user.password === md5(process.env.SECRET + req.body.password)) { 
        req.session.email = user.email;
        req.session.name = user.name;
        req.session.token = jwt.sign({ token: user.email }, process.env.SECRET);
        res.redirect("/");
        } else {
          req.session.destroy();
          res.send("<h2>Password is invalid</h2><br /><a href = '/'>Homepage</a>");
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

app.get("/about", (req, res) => {
  res.render("about", {
    session: req.session.email,
    aboutContent: aboutContent
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    session: req.session.email,
    contactContent: contactContent
  });
});

app.listen(PORT, () => {
  console.log("Server for a blog started on port ", PORT);
});

const getDate = () => {
  const today = new Date();
  const options = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
  }
  return today.toLocaleDateString('en-US', options);
}