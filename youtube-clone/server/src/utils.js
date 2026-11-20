import jwt from 'jsonwebtoken';

export function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
export function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    handle: user.handle,
    email: user.email,
    avatar: user.avatar,
    banner: user.banner,
    description: user.description,
    subscriberCount: user.subscribers?.length || 0,
    subscriptions: user.subscriptions || []
  };
}
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
