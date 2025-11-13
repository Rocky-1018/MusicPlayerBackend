const express = require('express');
const router = express.Router();
const Music = require('../models/Music');
const path = require('path');
const fs = require('fs');

// Get music list
router.get('/', async (req, res) => {
  const music = await Music.find();
  res.json(music);
});

// Download single music file
router.get('/:id/download', async (req, res) => {
  const track = await Music.findById(req.params.id);
  if (!track) return res.status(404).send('Music not found');
  const filePath = path.join(__dirname, '../uploads', track.fileUrl);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  res.download(filePath, track.title + '.mp3');
});

// In routes/music.js add:
router.post('/', async (req, res) => {
  const music = new Music(req.body);
  await music.save();
  res.status(201).json(music);
});


module.exports = router;
