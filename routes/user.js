const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email taken' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, email, passwordHash });
  await user.save();
  res.status(201).json({ message: 'Registered' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Get user preferences
router.get('/me/preferences', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.preferences);
});

// Update user preferences
router.put('/me/preferences', verifyToken, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { preferences: req.body });
  res.json({ message: 'Preferences updated' });
});

module.exports = router;
