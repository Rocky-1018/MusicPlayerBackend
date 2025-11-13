const express = require('express');
const router = express.Router();
const Music = require('../models/Music');
const path = require('path');
const fs = require('fs');

// Get all music tracks
router.get('/', async (req, res) => {
  try {
    const music = await Music.find();
    res.json(music);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching music' });
  }
});

// Get a single music track by ID
router.get('/:id', async (req, res) => {
  try {
    const track = await Music.findById(req.params.id);
    if (!track) return res.status(404).json({ message: 'Music not found' });
    res.json(track);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching music' });
  }
});

// Download single music file
router.get('/:id/download', async (req, res) => {
  try {
    const track = await Music.findById(req.params.id);
    if (!track) return res.status(404).send('Music not found');
    const filePath = path.join(__dirname, '../uploads', track.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.download(filePath, track.title + '.mp3');
  } catch (err) {
    res.status(500).send('Server error during download');
  }
});

// Create new music metadata
router.post('/', async (req, res) => {
  try {
    const music = new Music(req.body);
    await music.save();
    res.status(201).json(music);
  } catch (err) {
    res.status(400).json({ message: 'Error saving music', error: err.message });
  }
});

module.exports = router;
