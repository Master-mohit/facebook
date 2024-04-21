  const mongoose = require("mongoose")
  const plm = require("passport-local-mongoose");

  mongoose.connect("mongodb://127.0.0.1:27017/facebook");

  const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileImage: String,
 bio: String,
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: "post" }],

  stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "story" 
      }
    ],
    notifications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification"
  }],

    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],

    delete: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
   
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    
  });

  userSchema.plugin(plm) 

  module.exports = mongoose.model("user", userSchema); 
