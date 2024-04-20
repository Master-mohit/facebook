const mongoose = require("mongoose");


const storySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  file: {
    type: String, 
    required: true
  },
  fileType: {
    type: String, 
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const Story = mongoose.model('Story', storySchema);

module.exports = Story;
