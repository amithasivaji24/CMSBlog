const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// Connecting Mongoose
mongoose.connect('mongodb://localhost:27017/foodblog',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
  
  // Setting up the schema
  const User = new mongoose.Schema({
    username: String,
    password: String,
  });
  
  // Setting up the passport plugin
  User.plugin(passportLocalMongoose);
  
  module.exports = mongoose.model('User', User);

