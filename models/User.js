const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  profilePicture: { type: String, default: '' },
  likedSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }],
});

module.exports = mongoose.model('User', UserSchema);
