import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler, safeUser, signToken } from '../utils.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { name, handle, email, password } = req.body;
  if (!name || !handle || !email || !password) return res.status(400).json({ message: 'Name, handle, email and password are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  const normalizedHandle = handle.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._-]/g, '');
  if (normalizedHandle.length < 3) return res.status(400).json({ message: 'Handle must contain at least 3 valid characters' });
  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { handle: normalizedHandle }] });
  if (existing) return res.status(409).json({ message: 'Email or handle is already in use' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, handle: normalizedHandle, email: email.toLowerCase(), password: passwordHash });
  res.status(201).json({ token: signToken(user._id), user: safeUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: signToken(user._id), user: safeUser(user) });
}));

router.get('/me', protect, asyncHandler(async (req, res) => res.json({ user: safeUser(req.user) })));
export default router;
