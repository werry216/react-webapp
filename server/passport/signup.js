/* eslint-disable no-console */

import bcrypt from 'bcryptjs';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/user';

export default function (passport) {
  passport.use('signup', new LocalStrategy({
    passReqToCallback: true, // allows us to pass back the entire request to the callback
  },
  (req, username, password, done) => {
    // find a user in Mongo with provided username
    User.findOne({ username }, (err, user) => {
      // In case of any error, return using the done method
      if (err) {
        console.log(`Error in SignUp: ${err}`);
        done(err);
        return;
      }

      // already exists
      if (user) {
        done(null, false, { message: 'User Already Exists' });
        return;
      }

      // if there is no user with that email
      // create the user
      const newUser = new User();

      // set the user's local credentials
      newUser.username = username;
      bcrypt.genSalt(10, (saltErr, salt) => {
        bcrypt.hash(password, salt, (hashErr, hash) => {
          newUser.password = hash;
          // save the user
          newUser.save((saveErr) => {
            if (saveErr) {
              throw saveErr;
            }
            done(null, newUser);
          });
        });
      });
    });
  }));
}
