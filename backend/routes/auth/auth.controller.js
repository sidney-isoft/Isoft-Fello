//? Services
const authService = require('./auth.service')
const logger = require('../../services/logger.service')

module.exports = {
  login,
  signup,
  logout,
}

const isProduction = process.env.NODE_ENV === 'production'
const loginCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
}

async function login(req, res) {
  const { username, password } = req.body || {}
  try {
    const user = await authService.login(username, password)
    const loginToken = authService.getLoginToken(user)
    logger.info('User login:', user._id)
    res.cookie('loginToken', loginToken, loginCookieOptions)
    res.json(user)
  } catch (err) {
    if (err.statusCode !== 401 && err.statusCode !== 400) {
      logger.error('Failed to login', err)
    }
    res
      .status(err.statusCode || 500)
      .send({ err: err.statusCode ? err.message : 'Failed to login' })
  }
}

async function signup(req, res) {
  try {
    const credentials = req.body || {}
    await authService.signup(credentials)
    const user = await authService.login(
      credentials.username,
      credentials.password
    )
    const loginToken = authService.getLoginToken(user)
    logger.info('User signup:', user._id)
    res.cookie('loginToken', loginToken, loginCookieOptions)
    res.json(user)
  } catch (err) {
    if (!err.statusCode) logger.error('Failed to signup', err)
    res
      .status(err.statusCode || 500)
      .send({ err: err.statusCode ? err.message : 'Failed to signup' })
  }
}

async function logout(req, res) {
  try {
    res.clearCookie('loginToken', loginCookieOptions)
    res.send({ msg: 'Logged out successfully' })
  } catch (err) {
    res.status(500).send({ err: 'Failed to logout' })
  }
}
