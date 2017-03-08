export default function loadAuth(req) {
  return Promise.resolve(req.user ? { username: req.user.username } : null);
}
