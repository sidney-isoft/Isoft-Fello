//? Services
const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const bcrypt = require('bcrypt')
//? Data
const ObjectId = require('mongodb').ObjectId
//? Global Variables
const USERS_DB = 'users_col'

module.exports = {
  query,
  getById,
  getByUsername,
  remove,
  update,
  add,
  updateRole,
  resetPassword,
}

//? Query - List/Filtering/Sorting/Paging
async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy)
  try {
    const collection = await dbService.getCollection(USERS_DB)
    var users = await collection.find(criteria).toArray()
    users = users.map((user) => {
      delete user.password
      try {
        user.createdAt = user._id?.getTimestamp
          ? user._id.getTimestamp()
          : new ObjectId(user._id).getTimestamp()
      } catch (e) {
        user.createdAt = Date.now()
      }
      user._id = user._id.toString()
      return user
    })
    return users
  } catch (err) {
    logger.error('Cannot find users', err)
    throw err
  }
}

//? Get - Read
async function getById(userId) {
  try {
    if (!ObjectId.isValid(userId)) return null
    const collection = await dbService.getCollection(USERS_DB)
    const user = await collection.findOne({ _id: new ObjectId(userId) })
    if (user) {
      delete user.password
      user._id = user._id.toString()
    }
    return user
  } catch (err) {
    logger.error(`While finding user by id: ${userId}`, err)
    throw err
  }
}

//? Get - Read
async function getByUsername(username) {
  try {
    const collection = await dbService.getCollection(USERS_DB)
    const user = await collection.findOne({ username })
    if (user) {
      user._id = user._id.toString()
    }
    return user
  } catch (err) {
    logger.error(`While finding user by username: ${username}`, err)
    throw err
  }
}

//? Create - Save
async function add(user) {
  const { fullname, username, password, imgUrl, mentions, role } = user
  try {
    const userToAdd = {
      fullname,
      username,
      password,
      imgUrl: imgUrl || 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png',
      mentions: mentions || [],
      role: role || 'user',
    }
    const collection = await dbService.getCollection(USERS_DB)
    const { insertedId } = await collection.insertOne(userToAdd)
    return { ...userToAdd, _id: insertedId.toString() }
  } catch (err) {
    logger.error('Cannot add user', err)
    throw err
  }
}

//? Update - Edit
async function update(user) {
  const { _id, fullname, username, password, imgUrl, mentions } = user
  try {
    const userToSave = {
      _id: new ObjectId(_id),
      fullname: fullname,
      username: username,
      password: password,
      imgUrl: imgUrl,
      mentions: [
        {
          id: mentions?.id,
          boardId: mentions?.boardId,
          taskId: mentions?.taskId,
        },
      ],
    }
    const collection = await dbService.getCollection(USERS_DB)
    await collection.updateOne({ _id: userToSave._id }, { $set: userToSave })
    return { ...userToSave, _id: _id.toString() }
  } catch (err) {
    logger.error(`Cannot update user ${user._id}`, err)
    throw err
  }
}

//? Update role - only callable by globalAdmin
async function updateRole(userId, role) {
  try {
    const validRoles = ['user', 'boardAdmin', 'globalAdmin']
    if (!validRoles.includes(role)) throw new Error('Invalid role')
    if (!ObjectId.isValid(userId)) throw new Error('Invalid userId')
    const collection = await dbService.getCollection(USERS_DB)
    await collection.updateOne({ _id: new ObjectId(userId) }, { $set: { role } })
    const user = await collection.findOne({ _id: new ObjectId(userId) })
    if (user) {
      delete user.password
      user._id = user._id.toString()
    }
    return user
  } catch (err) {
    logger.error(`Cannot update role for user ${userId}`, err)
    throw err
  }
}

//? Reset password - only callable by globalAdmin
async function resetPassword(userId, newPassword) {
  try {
    if (!ObjectId.isValid(userId)) throw new Error('Invalid userId')
    const saltRounds = 10
    const hash = await bcrypt.hash(newPassword, saltRounds)
    const collection = await dbService.getCollection(USERS_DB)
    await collection.updateOne({ _id: new ObjectId(userId) }, { $set: { password: hash } })
    return { msg: 'Password reset successfully' }
  } catch (err) {
    logger.error(`Cannot reset password for user ${userId}`, err)
    throw err
  }
}

//? Remove - Delete
async function remove(userId) {
  try {
    if (!ObjectId.isValid(userId)) throw new Error('Invalid userId')
    const collection = await dbService.getCollection(USERS_DB)
    await collection.deleteOne({ _id: new ObjectId(userId) })
  } catch (err) {
    logger.error(`Cannot remove user ${userId}`, err)
    throw err
  }
}

//? Private Functions
function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.txt) {
    const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
    criteria.$or = [
      {
        username: txtCriteria,
      },
      {
        fullname: txtCriteria,
      },
    ]
  }
  return criteria
}
