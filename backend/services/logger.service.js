//? Services
const asyncLocalStorage = require('./als.service')
//? Private Variables
const TIME_FORMAT = 'he'

module.exports = {
  debug(...args) {
    if (process.env.NODE_ENV === 'production') return
    doLog('DEBUG', ...args)
  },
  info(...args) {
    doLog('INFO', ...args)
  },
  warn(...args) {
    doLog('WARN', ...args)
  },
  error(...args) {
    doLog('ERROR', ...args)
  },
}

//* Define the time format
function getTime() {
  let now = new Date()
  return now.toLocaleString(TIME_FORMAT)
}

function isError(e) {
  return e && e.stack && e.message
}

function doLog(level, ...args) {
  const strs = args.map((arg) =>
    typeof arg === 'string' || isError(arg) ? arg : JSON.stringify(arg)
  )
  let line = strs.join(' | ')
  const store = asyncLocalStorage.getStore()
  const userId = store?.loggedinUser?._id
  const str = userId ? `(userId: ${userId})` : ''
  line = `${getTime()} - ${level} - ${line} ${str}\n`
  console.log(line)
}
