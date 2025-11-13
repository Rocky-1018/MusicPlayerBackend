const express = require('express');
const path = require('path');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer'); 
const verifyToken = require('../middleware/auth');


// Multer storage config for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'profile_pictures'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({ storage });

// Update profile picture - upload and save filename as user attribute
router.put(
    '/me/profile-picture', 
    verifyToken,

    // NEW: Manual execution of Multer to catch its specific errors
    (req, res, next) => {
        upload.single('profilePicture')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred (e.g., file size limit, wrong field name)
                console.error('Multer Error:', err);
                return res.status(400).json({ success: false, message: 'File upload error: ' + err.code });
            } else if (err) {
                // An unknown error occurred
                console.error('Unknown Upload Error:', err);
                return res.status(500).json({ success: false, message: 'An unexpected error occurred during upload.' });
            }
            // If no error, proceed to the next middleware/route handler
            next();
        });
    },

    // Final route handler
    async (req, res) => {
        try {
            // This is reached only if Multer succeeded
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

            const filename = req.file.filename;
            const filepath = `/uploads/profile_pictures/${filename}`;

            // Save the path to the database
            await User.findByIdAndUpdate(req.user.id, { profilePicture: filepath });

            res.json({ success: true, profilePicture: filepath });
        } catch (error) {
            console.error('Profile picture update error:', error);
            res.status(500).json({ success: false, message: 'Server error updating profile picture' });
        }
    }
);
// Register user (no profile picture related code)
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

// Login user
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

// Get user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').populate('likedMusic');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile info (no profile picture)
router.put('/me', verifyToken, async (req, res) => {
  try {
    const updates = {};
    const { username, email } = req.body;

    if (username) updates.username = username;
    if (email) updates.email = email;
    await User.findByIdAndUpdate(req.user.id, updates);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/me/password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const validOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!validOldPassword) return res.status(400).json({ message: 'Old password is incorrect' });

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get liked music
router.get('/me/liked-music', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('likedMusic');
    res.json(user.likedMusic);
  } catch (err) {
    console.error('Get liked music error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a music item
router.post('/me/liked-music/:musicId', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { likedMusic: req.params.musicId },
    });
    res.json({ message: 'Music liked' });
  } catch (err) {
    console.error('Like music error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlike a music item
router.delete('/me/liked-music/:musicId', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { likedMusic: req.params.musicId },
    });
    res.json({ message: 'Music unliked' });
  } catch (err) {
    console.error('Unlike music error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
