const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const verifyToken = require('../middleware/auth');

// Get all playlists (Basic: public, Extended: private per user)
router.get('/', async (req, res) => {
  const playlists = await Playlist.find().populate('tracks');
  res.json(playlists);
});

// Create playlist
router.post('/', verifyToken, async (req, res) => {
  const playlist = new Playlist({ ...req.body, owner: req.user.id });
  await playlist.save();
  res.status(201).json(playlist);
});

// Delete playlist
router.delete('/:id', verifyToken, async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);
  if (!playlist) return res.status(404).send('Not found');
  if (playlist.owner && playlist.owner.toString() !== req.user.id) {
    return res.status(403).send('Forbidden');
  }
  await playlist.deleteOne();
  res.sendStatus(204);
});

module.exports = router;
