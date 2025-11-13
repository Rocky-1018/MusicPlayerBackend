const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
  title: String,
  artist: String,
  album: String,
  fileUrl: String,
  duration: Number,
  coverArt: String
});

module.exports = mongoose.model('Music', MusicSchema);
