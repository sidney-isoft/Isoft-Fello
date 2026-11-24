import { storageService } from '../connection/async-storage.service'
import { httpService } from '../connection/http.service'
import { socketService } from '../connection/socket.service'

const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'

export const userService = {
  login,
  logout,
  signup,
  getLoggedinUser,
  saveLocalUser,
  getUsers,
  getById,
  remove,
  update,
  changeScore,
  updateRole,
  resetPassword,
  addUser,
}

window.userService = userService

function getUsers() {
  return httpService.get(`user`)
}

async function getById(userId) {
  const user = await httpService.get(`user/${userId}`)
  return user
}

function remove(userId) {
  return httpService.delete(`user/${userId}`)
}

async function addUser(userCred) {
  return await httpService.post('user', userCred)
}

async function update({ _id, score }) {
  const user = await httpService.put(`user/${_id}`, { _id })
  if (getLoggedinUser()._id === user._id) saveLocalUser(user)
  return user
}

async function updateRole(userId, role) {
  return httpService.put(`user/${userId}/role`, { role })
}

async function resetPassword(userId, newPassword) {
  return httpService.put(`user/${userId}/reset-password`, { newPassword })
}

async function login(userCred) {
  const user = await httpService.post('auth/login', userCred)
  if (user) {
    socketService.login(user._id)
    return saveLocalUser(user)
  }
}

async function signup(userCred) {
  if (!userCred.imgUrl)
    userCred.imgUrl =
      'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'
  const user = await httpService.post('auth/signup', userCred)
  socketService.login(user._id)
  return saveLocalUser(user)
}

async function logout() {
  sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
  socketService.logout()
  return await httpService.post('auth/logout')
}

async function changeScore(by) {
  const user = getLoggedinUser()
  if (!user) throw new Error('Not loggedin')
  user.score = user.score + by || by
  await update(user)
  return user.score
}

function saveLocalUser(user) {
  user = {
    _id: user._id,
    fullname: user.fullname,
    imgUrl: user.imgUrl,
    role: user.role || (user.isAdmin ? 'globalAdmin' : 'user'),
    isAdmin: user.isAdmin,
  }
  sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(user))
  return user
}

function getLoggedinUser() {
  const user = JSON.parse(sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER))
  if (user && !user.role && user.isAdmin) {
    user.role = 'globalAdmin'
  }
  return user
}
