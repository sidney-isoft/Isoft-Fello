//? Services
const socketService = require('../../services/socket.service')
const userService = require('./user.service')
const authService = require('../auth/auth.service')
const logger = require('../../services/logger.service')

module.exports = {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
  updateUserRole,
  resetUserPassword,
  addUser,
}

//? Query - List/Filtering/Sorting/Paging
async function getUsers(req, res) {
  try {
    const filterBy = {
      txt: req.query?.txt || '',
      minBalance: +req.query?.minBalance || 0,
    }
    logger.debug('Getting Users..')
    const users = await userService.query(filterBy)
    logger.debug('Users got successfully! count:', users?.length)
    res.json(users)
  } catch (err) {
    logger.error('Failed to get users', err)
    res.status(500).send({ err: 'Failed to get users' })
  }
}

//? Get - Read
async function getUser(req, res) {
  try {
    const userId = req.params.id
    logger.debug('Getting User..', userId)
    const user = await userService.getById(userId)
    logger.debug('User got successfully!', userId)
    res.json(user)
  } catch (err) {
    logger.error('Failed to get user', err)
    res.status(500).send({ err: 'Failed to get user' })
  }
}

//? Add - Create user (Admin only)
async function addUser(req, res) {
  try {
    const { username, password, fullname, role, imgUrl } = req.body || {}
    if (!username || !password || !fullname) {
      return res.status(400).send({ err: 'Username, password and fullname are required' })
    }
    logger.debug('Adding user by admin..', username)
    const addedUser = await authService.signup({ username, password, fullname, imgUrl })
    if (role && role !== 'user') {
      await userService.updateRole(addedUser._id, role)
      addedUser.role = role
    }
    delete addedUser.password
    logger.debug('User added successfully by admin!', addedUser._id)
    res.json(addedUser)
  } catch (err) {
    logger.error('Failed to add user', err)
    res.status(err.statusCode || 500).send({ err: err.message || 'Failed to add user' })
  }
}

//? Update - Edit
async function updateUser(req, res) {
  try {
    const user = req.body
    logger.debug('Updating User..', user._id)
    const savedUser = await userService.update(user)
    logger.debug('User updated successfully!', user._id)
    res.send(savedUser)
  } catch (err) {
    logger.error('Failed to update user', err)
    res.status(500).send({ err: 'Failed to update user' })
  }
}

//? Update Role - globalAdmin only
async function updateUserRole(req, res) {
  try {
    const userId = req.params.id
    const { role } = req.body
    logger.debug('Updating role for user..', userId, role)
    const updatedUser = await userService.updateRole(userId, role)
    logger.debug('User role updated successfully!', userId)
    res.json(updatedUser)
  } catch (err) {
    logger.error('Failed to update user role', err)
    res.status(500).send({ err: 'Failed to update user role' })
  }
}

//? Reset Password - globalAdmin only
async function resetUserPassword(req, res) {
  try {
    const userId = req.params.id
    const { newPassword } = req.body
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      return res.status(400).send({ err: 'Password must be at least 4 characters' })
    }
    logger.debug('Resetting password for user..', userId)
    const result = await userService.resetPassword(userId, newPassword)
    logger.debug('Password reset successfully!', userId)
    res.json(result)
  } catch (err) {
    logger.error('Failed to reset password', err)
    res.status(500).send({ err: 'Failed to reset password' })
  }
}

//? Remove - Delete
async function deleteUser(req, res) {
  try {
    const userId = req.params.id
    logger.debug('Removing User..', userId)
    await userService.remove(userId)
    logger.debug('User removed successfully!', userId)
    res.send({ msg: 'Deleted successfully' })
  } catch (err) {
    logger.error('Failed to delete user', err)
    res.status(500).send({ err: 'Failed to delete user' })
  }
}
