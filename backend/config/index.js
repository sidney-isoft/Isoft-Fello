if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })
}

var config;

if (process.env.NODE_ENV === 'production') {
  config = require('./prod')
} else {
  config = require('./dev')
}

if (!config.dbURL || !config.dbName) {
  throw new Error('MONGODB_URI and MONGODB_DB_NAME must be set')
}

config.isGuestMode = true

module.exports = config
