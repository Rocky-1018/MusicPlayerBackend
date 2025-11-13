require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const musicRoutes = require('./routes/music');
const playlistRoutes = require('./routes/playlist');
const userRoutes = require('./routes/user');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); 

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error(err));

app.use('/api/music', musicRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/auth', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
