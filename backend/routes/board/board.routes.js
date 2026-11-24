//? Libraries
const express = require('express')
//? Middleware
const {
  requireAuth,
  requireAdmin,
} = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
//? Controller
const {
  getBoards,
  getBoardById,
  addBoard,
  updateBoard,
  removeBoard,
  addBoardMsg,
  removeBoardMsg,
  updateBoardMemberPermission,
  removeBoardMember,
} = require('./board.controller')
//? Config
const router = express.Router()

router.get('/', requireAuth, log, getBoards)
router.get('/:id', requireAuth, getBoardById)
router.post('/', requireAuth, addBoard)
router.put('/:id', requireAuth, updateBoard)
router.delete('/:id', requireAuth, removeBoard)

router.post('/:id/msg', requireAuth, addBoardMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeBoardMsg)

// Board permissions
router.put('/:id/member/:memberId/permission', requireAuth, updateBoardMemberPermission)
router.delete('/:id/member/:memberId', requireAuth, removeBoardMember)

module.exports = router
