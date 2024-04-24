var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const storyModel = require("./story");
const commentModel = require("./comment");  
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
passport.use(new localStrategy(userModel.authenticate()));


router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/search', function(req, res, next) {
  res.render('search');
});

router.get('/bio', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('bio', { user });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});


router.post('/bio', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user })
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.bio = req.body.bio;
    await user.save();
    res.redirect('/bio');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

router.post('/story', isLoggedIn, upload.single('storyFile'), async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const story = await storyModel.create({
      user: user._id,
      file: req.file.filename, 
      fileType: req.file.mimetype 
    });

    user.stories.push(story._id);
    await user.save();

    res.render('story', { user, file: req.file.filename });
  
  } catch (error) {
    console.error(error);
   
  }
});





router.get('/likee/:id', async function(req, res, next) {
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
    res.redirect("back");
  } catch (error) {
   
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/commentt/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id).populate("user");
    
    res.render('commentt', { post, user });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
});

router.post('/commentt/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id).populate("user");
    
    const newComment = await commentModel.create({
      text: req.body.text,
      user: user._id,
      post: post._id
    });
    post.comments.push(newComment._id);
    await post.save();
    return res.status(200).json({ msg: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
});


router.get('/openprofile/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const pro = await postModel.findById(req.params.id).populate("user"); 
    res.render('openprofile', { user, pro });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
});


router.get('/mess/:id',isLoggedIn, async function(req, res, next) {
  const user = await userModel.find({username: req.session.passport.user})
  const pro = await userModel.findById(req.params.id);
  res.render('mess', {user, pro});
});


router.get('/message',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("friends")
  res.render('message', {user});
});

router.get('/finallyFrd/:id', isLoggedIn, async function(req, res, next) {
  try {

    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
    if (!loggedInUser) {
      return res.status(404).send("User not found");
    }
    const friendToAdd = await userModel.findById(req.params.id);
    if (!friendToAdd) {
      return res.status(404).send("Friend not found");
    }

    if (loggedInUser.friends.includes(friendToAdd._id) && friendToAdd.friends.includes(loggedInUser._id)) {
      return res.status(400).send("Already friends");
    }
    loggedInUser.friends.push(friendToAdd._id);
    await loggedInUser.save();

    friendToAdd.friends.push(loggedInUser._id);
    await friendToAdd.save();

    res.render('finallyFrd');
    res.render('subdirectory/finallyFrd');

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/finallyFrd/:id', isLoggedIn, async function(req, res, next) {
  try {
    res.render('finallyFrd', {});
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/addFrds/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate('friendRequests', 'username profileImage');
    if (!user) {
      return res.status(404).send("User not found");
    }
    const pro = req.params.id;
    res.render('addFrds', { user, pro });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get('/cancelFriendRequest/:id', isLoggedIn, async function(req, res, next) {
  try {
    // Fetch the logged-in user's data including friend requests
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user }).populate('friendRequests');

    // Find the index of the friend request to cancel
    const indexToRemove = loggedInUser.friendRequests.findIndex(request => request._id.toString() === req.params.id);
    if (indexToRemove === -1) {
      return res.status(400).send("Friend request not found");
    }

    // Remove the friend request from the array
    loggedInUser.friendRequests.splice(indexToRemove, 1);

    // Save the updated user data
    await loggedInUser.save();

    // Redirect to the friendlist page
    res.redirect("/friendlist/" + loggedInUser._id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/addFriend/:id', isLoggedIn, async function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
    if (!loggedInUser) {
      return res.status(404).send("User not found");
    }

    const userToAddFriend = await userModel.findById(req.params.id);
    if (!userToAddFriend) {
      return res.status(404).send("User to add friend not found");
    }
    if (loggedInUser._id.toString() === req.params.id) {
      return res.status(400).send("You cannot send a friend request to yourself");
    }
    const isFriendRequestSent = loggedInUser.friendRequests.includes(userToAddFriend._id.toString());
    if (isFriendRequestSent) {
      // If request already sent, remove it and save changes
      const indexToRemove = loggedInUser.friendRequests.indexOf(userToAddFriend._id.toString());
      loggedInUser.friendRequests.splice(indexToRemove, 1);
      await loggedInUser.save();
      console.log("Friend request cancelled");
    } else {
      // If request not sent, push it and save changes
      userToAddFriend.friendRequests.push(loggedInUser._id);
      await userToAddFriend.save();
      console.log("Friend request sent successfully");
    }

    res.redirect("/friendlist/" + loggedInUser._id);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/friendlist/:id', isLoggedIn, async function(req, res, next) {
  try {
      const userId = req.params.id;
      const user = await userModel.findById(userId);
      if (!user) {
          return res.status(404).send("User not found");
      }
      const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
      if (!loggedInUser) {
          return res.status(404).send("Logged-in user not found");
      }

      res.render('friendlist', { user, loggedInUser }); 
  } catch (error) {
      console.error('Error retrieving user details:', error);
      res.status(500).send('Internal Server Error');
  }
});


router.post('/searchUser', isLoggedIn, async (req, res, next) => {
  try {
      const data = req.body.data;

      const allUsers = await userModel.find({
          username: {
              $regex: data,
              $options: 'i'
          }
      });

      console.log(allUsers);

      res.status(200).json(allUsers);
  } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/comment/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id).populate("user");
    
    res.render('comment', { post, user });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
});

router.post('/comment/:id', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.findById(req.params.id).populate("user");
    
    const newComment = await commentModel.create({
      text: req.body.text,
      user: user._id,
      post: post._id
    });
    post.comments.push(newComment._id);
    await post.save();

    // Send success response with the newly created comment
    return res.status(200).json({ msg: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
});


router.get('/sbox',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("saved")
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
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.findById(req.params.id).populate("user")
  res.render('save', {user, post});
});

router.get('/save/post/:id', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
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


router.get('/main', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const stories = await storyModel.find({ user: user._id });

    const posts = await postModel.find().populate("user");

    res.render('main', { user, posts, stories });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
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
