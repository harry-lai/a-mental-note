const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Sentiment = require('sentiment');
const User = require('./models/User');
const JournalEntry = require('./models/JournalEntry');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); 

// MongoDB Connection
mongoose.connect('mongodb+srv://harrylai126:qZBUNtyuvOsPlS2S@journalington.ez0rk.mongodb.net/?retryWrites=true&w=majority&appName=journalington')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const sentiment = new Sentiment();

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, 'secretkey'); 
    req.user = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Sign-Up Route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the database
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });

    // Verify the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid username or password' });

    // Generate a token
    const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '1h' });

    // Return the token
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.get('/entries', authMiddleware, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user })
      .sort({ createdAt: -1 })
      .select('title text sentiment createdAt');
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: 'Error fetching entries' });
  }
});

// Journal Entry Routes
app.post('/entries', authMiddleware, async (req, res) => {
  const { title, text } = req.body;

  console.log('Received request:', req.body); // Log received data
  console.log('User ID from token:', req.user); // Log user ID from token

  // Validate that title and text are provided
  if (!title || !text) {
    console.error('Missing title or text:', { title, text });
    return res.status(400).json({ message: 'Title and text are required' });
  }

  // Analyze sentiment for the text
  const sentimentResult = sentiment.analyze(text);
  console.log('Sentiment analysis result:', sentimentResult); 

  try {
    // Create a new journal entry
    const newEntry = new JournalEntry({
      title, // Include title
      text,  // Include text
      sentiment: sentimentResult.score,
      user: req.user, // Associate entry with authenticated user
    });

    // Save the journal entry to the database
    const savedEntry = await newEntry.save();
    console.log('Saved entry:', savedEntry); 

    // Respond with success message and saved entry
    res.status(201).json({ message: 'Entry saved successfully!', entry: savedEntry });
  } catch (error) {
    console.error('Error saving entry:', error);
    res.status(500).json({ message: 'Error saving entry' });
  }
});


app.get('/test-db', async (req, res) => {
  try {
    const testEntry = new JournalEntry({
      text: 'Test entry',
      sentiment: 1,
      user: '648df29f8b647a001fbabe12', 
    });
    const savedEntry = await testEntry.save();
    res.json({ message: 'Test entry saved', entry: savedEntry });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
