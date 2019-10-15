//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');
const md5 = require("md5");

const homeStartingContent = "Simple blog app.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices.";

const app = express();

app.set('view engine', 'ejs');

const uri = "mongodb+srv://vova:"+ process.env.BD_PASS +"@bloglvluptest-iyvhk.mongodb.net/blog_base?retryWrites=true&w=majority";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true }).then(
  () => {console.log("DB Connected")},
  () => {console.error(err)}
);

const postSchema = new mongoose.Schema ({
  title: String,
  content: String
});

const userSchema = new mongoose.Schema ({
  name: String,
  email: String,
  password: String
});

const Post = mongoose.model("Post", postSchema);
const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {

  let truePosts = [];

  Post.find({}, (err, returnedPosts) => {
    if (err) {
      console.log(err);
      res.render("404", {});
    } else {
      console.log(returnedPosts);
      for (post of returnedPosts) {
        shortContent = _.truncate(post.content, {'length': 60});
    
        truePosts.push({ 
          title : post.title,
          content : shortContent
         })
      }
    
      res.render("home", {
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
      res.render("404", {});
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
          postTitle: actualPost.title,
          postContent: actualPost.content
        });
      }
      else {
        console.log("No matches found");
        res.render("404", {});
      }

    }
  })

});

app.get("/register", (req, res) => {
  res.render("register", {});
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

  res.render("register", {});
});

app.get("/login", (req, res) => {
  res.render("login", {});
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
          res.send("<h2>You logged in successfully</h2><br /><a href = '/'>Homepage</a>");
        } else {
          res.send("<h2>Password is invalid</h2><br /><a href = '/'>Homepage</a>");
        }
      } else {
        res.send("<h2>User not found</h2><br /><a href = '/'>Homepage</a>");
      }
    }
  });
});

app.get("/compose", (req, res) => {
  res.render("compose", {});
});

app.post("/compose", (req, res) => {
  
  console.log(req.body);

  const newPost = new Post ({
    title: req.body.postTitle,
    content: req.body.postContent
  })

  newPost.save();

  res.render("compose", {});
});

app.get("/about", (req, res) => {
  res.render("about", {
    aboutContent: aboutContent
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    contactContent: contactContent
  });
});

app.listen(3000, () => {
  console.log("Server for a blog started on port 3000");
});
