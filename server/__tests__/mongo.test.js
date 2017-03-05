import mongoose from 'mongoose';
import secrets from '../../config/secrets';

describe('Mongo', () => {
  it('should connect to mongo', (done) => {
    mongoose.connect(secrets.db, (dbErr) => {
      if (dbErr) {
        done(dbErr);
      } else {
        done();
      }
    });
  });
});
