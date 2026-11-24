//? Services
const boardService = require('./board.service')
const socketService = require('../../services/socket.service')
const logger = require('../../services/logger.service')

module.exports = {
  getBoards,
  getBoardById,
  addBoard,
  updateBoard,
  removeBoard,
  addBoardMsg,
  removeBoardMsg,
  updateBoardMemberPermission,
  removeBoardMember,
}

//? Query - List/Filtering/Sorting/Paging
async function getBoards(req, res) {
  try {
    const { query } = req
    const loggedinUser = req.loggedinUser || {}
    const userId = loggedinUser._id
    const role = loggedinUser.role || (loggedinUser.isAdmin ? 'globalAdmin' : 'user')
    logger.debug('Getting Boards..')
    const boards = await boardService.query(query, userId, role)
    logger.debug('Boards got successfully!')
    res.json(boards || [])
  } catch (err) {
    logger.error('Had issues while getting boards', err)
    res.status(500).send({ err: 'Had issues while getting boards' })
  }
}

//? Get - Read
async function getBoardById(req, res) {
  try {
    const boardId = req.params.id
    const loggedinUser = req.loggedinUser || {}
    const userId = loggedinUser._id
    const role = loggedinUser.role || (loggedinUser.isAdmin ? 'globalAdmin' : 'user')
    logger.debug('Getting Board..', boardId)
    const board = await boardService.getById(boardId, userId, role)
    if (!board) return res.status(404).send({ err: 'Board not found' })
    logger.debug('Board got successfully!', boardId)
    res.json(board)
  } catch (err) {
    logger.error('Had issues while getting board', err)
    res.status(500).send({ err: 'Had issues while getting board' })
  }
}

//? Create - Save
async function addBoard(req, res) {
  try {
    const boardData = { ...req.body }
    delete boardData._id
    const owner = {
      _id: req.loggedinUser._id.toString(),
      fullname: req.loggedinUser.fullname,
      imgUrl: req.loggedinUser.imgUrl,
      permission: 'owner',
    }
    if (typeof boardData.title !== 'string' || !boardData.title.trim()) {
      return res.status(400).send({ err: 'Board title is required' })
    }
    const board = {
      ...boardData,
      title: boardData.title.trim(),
      createdBy: owner,
      members: [owner],
      groups: [],
    }
    logger.debug('Adding Board..')
    const addedBoard = await boardService.add(board)
    logger.debug('Board added successfully!')
    res.json(addedBoard)
  } catch (err) {
    logger.error('Had issues while adding board', err)
    res.status(500).send({ err: 'Had issues while adding board' })
  }
}

//? Update - Edit
async function updateBoard(req, res) {
  try {
    const board = { ...req.body, _id: req.params.id }
    const { _id: boardId } = board
    const loggedinUser = req.loggedinUser || {}
    const userId = loggedinUser._id
    const role = loggedinUser.role || (loggedinUser.isAdmin ? 'globalAdmin' : 'user')
    logger.debug('Updating Board..', boardId)
    const updatedBoard = await boardService.update(board, userId, role)
    if (!updatedBoard) return res.status(404).send({ err: 'Board not found' })
    logger.debug('Board updated successfully!', boardId)

    socketService.emitTo({ type: 'board-updated', data: board })

    res.json(updatedBoard)
  } catch (err) {
    logger.error('Had issues while updating board', err)
    res.status(500).send({ err: 'Had issues while updating board' })
  }
}

//? Remove - Delete
async function removeBoard(req, res) {
  try {
    const boardId = req.params.id
    const loggedinUser = req.loggedinUser || {}
    const userId = loggedinUser._id
    const role = loggedinUser.role || (loggedinUser.isAdmin ? 'globalAdmin' : 'user')
    logger.debug('Removing Board..', boardId)
    const removed = await boardService.remove(boardId, userId, role)
    if (!removed) return res.status(404).send({ err: 'Board not found' })
    logger.debug('Board removed successfully!', boardId)
    res.send(boardId)
  } catch (err) {
    logger.error('Failed to remove board', err)
    res.status(500).send({ err: 'Failed to remove board' })
  }
}

async function addBoardMsg(req, res) {
  const { loggedinUser } = req
  try {
    const boardId = req.params.id
    const msg = {
      txt: req.body.txt,
      by: loggedinUser,
    }
    const savedMsg = await boardService.addBoardMsg(boardId, msg)
    res.json(savedMsg)
  } catch (err) {
    logger.error('Failed to update board', err)
    res.status(500).send({ err: 'Failed to update board' })
  }
}

async function removeBoardMsg(req, res) {
  const { loggedinUser } = req
  try {
    const boardId = req.params.id
    const { msgId } = req.params

    const removedId = await boardService.removeBoardMsg(boardId, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove board msg', err)
    res.status(500).send({ err: 'Failed to remove board msg' })
  }
}

//? Update a member's board permission
async function updateBoardMemberPermission(req, res) {
  try {
    const { id: boardId, memberId } = req.params
    const { permission } = req.body
    const { _id: requesterId, role: requesterRole } = req.loggedinUser

    if (!['read', 'modify', 'owner'].includes(permission)) {
      return res.status(400).send({ err: 'Invalid permission value' })
    }

    const result = await boardService.updateBoardMemberPermission(
      boardId, memberId, permission, requesterId, requesterRole
    )
    if (!result) return res.status(404).send({ err: 'Board or member not found, or insufficient permissions' })
    res.json(result)
  } catch (err) {
    logger.error('Failed to update board member permission', err)
    res.status(500).send({ err: 'Failed to update board member permission' })
  }
}

//? Remove a member from a board
async function removeBoardMember(req, res) {
  try {
    const { id: boardId, memberId } = req.params
    const { _id: requesterId, role: requesterRole } = req.loggedinUser

    const result = await boardService.removeBoardMember(
      boardId, memberId, requesterId, requesterRole
    )
    if (!result) return res.status(404).send({ err: 'Board or member not found, or insufficient permissions' })
    res.json(result)
  } catch (err) {
    logger.error('Failed to remove board member', err)
    res.status(500).send({ err: 'Failed to remove board member' })
  }
}
