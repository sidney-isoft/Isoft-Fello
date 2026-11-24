//? Libraries
const express = require('express')
//? Middleware
const {
  requireAuth,
  requireAdmin,
  requireGlobalAdmin,
} = require('../../middlewares/requireAuth.middleware')
//? Controller
const {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
  updateUserRole,
  resetUserPassword,
  addUser,
} = require('./user.controller')
//? Config
const router = express.Router()

router.get('/', requireAuth, getUsers)
router.get('/:id', requireAuth, getUser)
router.post('/', requireAuth, requireGlobalAdmin, addUser)
router.put('/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, requireGlobalAdmin, deleteUser)

// Admin-only routes
router.put('/:id/role', requireAuth, requireGlobalAdmin, updateUserRole)
router.put('/:id/reset-password', requireAuth, requireGlobalAdmin, resetUserPassword)

module.exports = router
