module.exports = {
  db: process.env.MONGODB_URI || 'mongodb://localhost/react-dev-webkit',

  session: process.env.SESSION_SECRET || 'Your session secret goes here',
};
