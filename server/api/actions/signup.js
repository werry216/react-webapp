import passport from 'passport';

export default function signup(req) {
  return new Promise((resolve, reject) => {
    passport.authenticate('signup', (err, user, info) => {
      if (err) {
        reject({
          message: err,
        });
        return;
      }

      if (!user) {
        reject({
          message: info.message,
          status: 403,
        });
        return;
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          reject({
            message: 'Issue logging in.',
          });
        } else {
          resolve({ username: user.username });
        }
      });
    })(req);
  });
}
