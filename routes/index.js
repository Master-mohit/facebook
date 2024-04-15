var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/sbox',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.find();
  res.render('sbox', {user, post});
});


router.get('/menu',isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('menu', {user});
});

router.get('/unsave/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id);

    if (!user || !post) {
      return res.status(404).send("User or Post not found");
    }
    const index = user.saved.indexOf(post._id);
    if (index !== -1) {
      user.saved.splice(index, 1);
      await user.save();
    }
    res.redirect("/sbox");
  } catch (error) {
    next(error);
  }
});


router.get('/save/:id', isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.findById(req.params.id)
  res.render('save', {user, post});
});

router.get('/save/post/:id', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.findById(req.params.id);
  
  if (!user.saved.includes(post._id)) {
    user.saved.push(post._id);
    await user.save();
    res.redirect("/main")
  }
});

router.get('/delete/post/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id);
  
    if (post && (post.user.toString() === user._id.toString())) {
      await postModel.findByIdAndDelete(req.params.id);
    }
    
    res.redirect('/main');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/like/:id', async function(req, res, next) {
  try {
    
    if (!req.session.passport || !req.session.passport.user) {
      return res.status(401).send("Unauthorized");
    }
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    const likedIndex = post.likes.indexOf(user._id);
    if (likedIndex === -1) {
    
      post.likes.push(user._id);
    } else {
      post.likes.splice(likedIndex, 1);
    }
    await post.save();
    res.redirect("/main");
  } catch (error) {
   
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/main',isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const posts = await postModel.find().populate("user");
  res.render('main', {user, posts});
});


router.get('/createp',isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('createp', {user});
});

router.post('/createp',isLoggedIn, upload.single("image"),async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.create({
    picture: req.file.filename,
    caption: req.body.caption,
    user: user._id
  })
  user.posts.push(post._id)
 await user.save();
 res.redirect("/main")
});

router.get('/profile',isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('profile' , {user});
});

router.post('/profile', isLoggedIn, upload.single('image'), async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (req.file) {
      user.profileImage = req.file.filename;
      await user.save();
    }
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});




router.post('/register', function(req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
  });
  userModel.register(userData, req.body.password)
    .then((user)=> {
      passport.authenticate("local")(req, res, ()=> {
        res.redirect("/main");
      });
    })
    .catch((err)=> {
      res.send(err);
    });
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/main",
  failureRedirect: "/login"
}));


router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/');
    });
  else {
    res.redirect('/');
  }
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
