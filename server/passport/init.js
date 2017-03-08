/* eslint-disable no-console */

import login from './login';
import signup from './signup';
import User from '../models/user';

export default function (passport) {
  // Passport serializes and deserializes users to support persistent login sessions
  passport.serializeUser((user, done) => {
    // console.log(`serializing user: ' ${user._id}`);
    done(null, user._id); // eslint-disable-line
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      // console.log(`deserializing user:', ${user}`);
      done(err, user);
    });
  });

  // Setting up Passport Strategies for Login and SignUp/Registration
  login(passport);
  signup(passport);
}
