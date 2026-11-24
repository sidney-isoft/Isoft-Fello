import { userService } from '../../services/user/user.service'
import { store } from '../store'

import { showErrorMsg } from '../../services/connection/event-bus.service'
import { LOADING_DONE, LOADING_START } from '../reducers/system.reducer'
import {
  REMOVE_USER,
  SET_USER,
  SET_USERS,
  SET_WATCHED_USER,
} from '../reducers/user.reducer.js'
import { CLEAN_STORE } from '../reducers/board.reducer.js'

export async function loadUsers() {
  try {
    store.dispatch({ type: LOADING_START })
    const users = await userService.getUsers()
    store.dispatch({ type: SET_USERS, users })
  } catch (err) {
    console.log('UserActions: err in loadUsers', err)
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
