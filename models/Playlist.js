const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
  name: String,
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});

module.exports = mongoose.model('Playlist', PlaylistSchema);
