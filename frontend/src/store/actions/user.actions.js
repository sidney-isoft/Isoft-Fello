import { userService } from '../../services/user/user.service'
import { store } from '../store'

import { showErrorMsg, showSuccessMsg } from '../../services/connection/event-bus.service'
import { LOADING_DONE, LOADING_START } from '../reducers/system.reducer'
import {
  REMOVE_USER,
  SET_USER,
  SET_USERS,
  ADD_USER,
  SET_WATCHED_USER,
  UPDATE_USER_ROLE,
} from '../reducers/user.reducer.js'
import { CLEAN_STORE } from '../reducers/board.reducer.js'

export async function loadUsers() {
  try {
    store.dispatch({ type: LOADING_START })
    const users = await userService.getUsers()
    store.dispatch({ type: SET_USERS, users })
    return users
  } catch (err) {
    console.log('UserActions: err in loadUsers', err)
    showErrorMsg('Cannot load users')
    throw err
  } finally {
    store.dispatch({ type: LOADING_DONE })
  }
}

export async function removeUser(userId) {
  try {
    await userService.remove(userId)
    store.dispatch({ type: REMOVE_USER, userId })
  } catch (err) {
    console.log('UserActions: err in removeUser', err)
    throw err
  }
}

export async function addUser(userCred) {
  try {
    const user = await userService.addUser(userCred)
    store.dispatch({ type: ADD_USER, user })
    return user
  } catch (err) {
    console.log('UserActions: err in addUser', err)
    throw err
  }
}

export async function login(credentials) {
  const user = await userService.login(credentials)
  store.dispatch({
    type: SET_USER,
    user,
  })
  return user
}

export async function signup(credentials) {
  const user = await userService.signup(credentials)
  store.dispatch({
    type: SET_USER,
    user,
  })
  return user
}

export async function logout() {
  try {
    await userService.logout()
  } catch (err) {
    console.log('Cannot logout', err)
    throw err
  } finally {
    store.dispatch({ type: SET_USER, user: null })
    store.dispatch({ type: CLEAN_STORE })
  }
}

export async function loadUser(userId) {
  try {
    const user = await userService.getById(userId)
    store.dispatch({ type: SET_WATCHED_USER, user })
  } catch (err) {
    showErrorMsg('Cannot load user')
    console.log('Cannot load user', err)
  }
}

export async function updateUserRole(userId, role) {
  try {
    const updatedUser = await userService.updateRole(userId, role)
    store.dispatch({ type: UPDATE_USER_ROLE, userId, role: updatedUser.role })
    return updatedUser
  } catch (err) {
    console.log('UserActions: err in updateUserRole', err)
    throw err
  }
}

export async function resetUserPassword(userId, newPassword) {
  try {
    return await userService.resetPassword(userId, newPassword)
  } catch (err) {
    console.log('UserActions: err in resetUserPassword', err)
    throw err
  }
}
