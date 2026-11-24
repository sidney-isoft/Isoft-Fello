//? Libraries
const Cryptr = require('cryptr')
const bcrypt = require('bcrypt')
//? Services
const userService = require('../user/user.service')
const logger = require('../../services/logger.service')
//? Config
const secret =
  process.env.SECRET1 ||
  (process.env.NODE_ENV === 'production' ? null : 'local-development-secret')
if (!secret) throw new Error('SECRET1 must be set in production')
const cryptr = new Cryptr(secret)

module.exports = {
  signup,
  login,
  getLoginToken,
  validateToken,
}

async function login(username, password) {
  const normalizedUsername =
    typeof username === 'string' ? username.trim() : ''
  if (!normalizedUsername || typeof password !== 'string' || !password) {
    throw createAuthError('Username and password are required', 400)
  }

  logger.debug(`auth.service - login with username: ${normalizedUsername}`)
  const user = await userService.getByUsername(normalizedUsername)
  const passwordMatches =
    user?.password && (await bcrypt.compare(password, user.password))
  if (!passwordMatches) {
    throw createAuthError('Invalid username or password', 401)
  }

  const publicUser = { ...user }
  delete publicUser.password
  return { ...publicUser, _id: user._id.toString() }
}

async function signup({ username, password, fullname, imgUrl }) {
  const saltRounds = 10
  const normalizedUsername =
    typeof username === 'string' ? username.trim() : ''

  if (!normalizedUsername || typeof password !== 'string' || !password) {
    throw createAuthError('Username and password are required', 400)
  }

  logger.debug(`auth.service - signup with username: ${normalizedUsername}`)
  const userExist = await userService.getByUsername(normalizedUsername)
  if (userExist) throw createAuthError('Username already taken', 409)

  const hash = await bcrypt.hash(password, saltRounds)
  return userService.add({
    username: normalizedUsername,
    password: hash,
    fullname:
      typeof fullname === 'string' && fullname.trim()
        ? fullname.trim()
        : normalizedUsername,
    imgUrl,
  })
}

function getLoginToken(user) {
  const userInfo = {
    _id: user._id,
    fullname: user.fullname,
    isAdmin: user.isAdmin,
    imgUrl: user.imgUrl,
    role: user.role || 'user',
  }
  return cryptr.encrypt(JSON.stringify(userInfo))
}

function validateToken(loginToken) {
  if (!loginToken) return null
  try {
    const json = cryptr.decrypt(loginToken)
    const loggedInUser = JSON.parse(json)
    return loggedInUser
  } catch (err) {
    logger.debug('Invalid login token')
  }
  return null
}

function createAuthError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
