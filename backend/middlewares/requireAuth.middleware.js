const logger = require('../services/logger.service')
const asyncLocalStorage = require('../services/als.service')

function requireAuth(req, res, next) {
  const loggedinUser = asyncLocalStorage.getStore()?.loggedinUser
  if (!loggedinUser) return res.status(401).send('Not Authenticated')
  req.loggedinUser = loggedinUser
  next()
}

function requireAdmin(req, res, next) {
  const loggedinUser = asyncLocalStorage.getStore()?.loggedinUser
  if (!loggedinUser) return res.status(401).send('Not Authenticated')
  const isAdmin =
    loggedinUser.isAdmin ||
    loggedinUser.role === 'globalAdmin' ||
    loggedinUser.role === 'boardAdmin'
  if (!isAdmin) {
    logger.warn(loggedinUser.fullname + ' attempted to perform admin action')
    res.status(403).end('Not Authorized')
    return
  }
  next()
}

function requireGlobalAdmin(req, res, next) {
  const loggedinUser = asyncLocalStorage.getStore()?.loggedinUser
  if (!loggedinUser) return res.status(401).send('Not Authenticated')
  const isGlobalAdmin = loggedinUser.isAdmin || loggedinUser.role === 'globalAdmin'
  if (!isGlobalAdmin) {
    logger.warn(loggedinUser.fullname + ' attempted to perform global admin action')
    res.status(403).end('Not Authorized')
    return
  }
  next()
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireGlobalAdmin,
}
