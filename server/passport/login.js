/* eslint-disable no-console */

import bcrypt from 'bcryptjs';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/user';

export default function (passport) {
  passport.use('login', new LocalStrategy({
    passReqToCallback: true,
  },
  (req, username, password, done) => {
    // check in mongo if a user with username exists or not
    User.findOne({ username }, (err, user) => {
        // In case of any error, return using the done method
      if (err) {
        done(err);
        return;
      }
      // Username does not exist, log the error and redirect back
      if (!user) {
        console.log(`User Not Found with username ${username}`);
        done(null, false, { message: 'Incorrect username or password' });
        return;
      }

      bcrypt.compare(password, user.password).then((isValidPassword) => {
        // User exists but wrong password, log the error
        if (!isValidPassword) {
          console.log('Invalid Password');
          done(null, false, { message: 'Incorrect username or password' }); // redirect back to login page
          return;
        }
        // User and password both match, return user from done method
        // which will be treated like success
        done(null, user);
      });
    });
  }));
}
