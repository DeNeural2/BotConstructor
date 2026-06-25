const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password too short' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  res.status(201).json({ token: sign(user._id), user: { id: user._id, email: user.email } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ token: sign(user._id), user: { id: user._id, email: user.email } });
});

module.exports = router;
