const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash });

    await user.save();
    res.status(201).json({ message: 'Registered' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile (includes preferences, profilePicture, likedSongs)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash')
      .populate('likedSongs'); // populate likedSongs details
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile info (username, email, profilePicture)
router.put('/me', verifyToken, async (req, res) => {
  try {
    const updates = {};
    const { username, email, profilePicture } = req.body;

    if (username) updates.username = username;
    if (email) updates.email = email;
    if (profilePicture) updates.profilePicture = profilePicture;

    await User.findByIdAndUpdate(req.user.id, updates);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Update user password
router.put('/me/password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!validOldPassword)
      return res.status(400).json({ message: 'Old password is incorrect' });

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get liked songs
router.get('/me/liked-songs', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('likedSongs');
    res.json(user.likedSongs);
  } catch (err) {
    console.error('Get liked songs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a song
router.post('/me/liked-songs/:songId', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { likedSongs: req.params.songId },
    });
    res.json({ message: 'Song liked' });
  } catch (err) {
    console.error('Like song error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlike a song
router.delete('/me/liked-songs/:songId', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { likedSongs: req.params.songId },
    });
    res.json({ message: 'Song unliked' });
  } catch (err) {
    console.error('Unlike song error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
