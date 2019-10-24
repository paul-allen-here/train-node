const mongoose = require('mongoose');

const uri = "mongodb+srv://vova:"+ process.env.BD_PASS +"@bloglvluptest-iyvhk.mongodb.net/blog_base?retryWrites=true&w=majority";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('DB connected...'))
  .catch(err => console.log(err));

mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema ({
  id : String,
  title: String,
  content: String,
  by: String,
  time: String,
  creator_id: String
});

const Post = mongoose.model("Post", postSchema);

const getPosts = (page = 1) => {
    let resPerPage = 10;
    return Post.find({})
        .skip((resPerPage * page) - resPerPage)
        .limit(resPerPage).exec();
};

const getOnePost = (post_id) => {
    return Post.findOne({ id: post_id }).exec(); 
};

const composePost = (post) => {
    const newPost = new Post ({
        id : post.id,
        title : post.title,
        content : post.content,
        by : post.by,
        time : post.time,
        creator_id: post.creator_id
    });
    return newPost.save();
};

const deletePost = (post_id) => {
    return Post.deleteOne({ id: post_id }).exec(); 
};

const registerUser = (user) => {
    const newUser = new User ({
        name: user.name,
        email: user.email,
        password: user.password
    });
    return newUser.save();
}

const loginUser = (email) => {
    return User.findOne({ email: email }).exec(); 
};

exports.getPosts = getPosts;
exports.getOnePost = getOnePost;
exports.composePost = composePost;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.deletePost = deletePost;
