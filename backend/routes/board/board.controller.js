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
}

//? Query - List/Filtering/Sorting/Paging
async function getBoards(req, res) {
  try {
    const { query } = req
    logger.debug('Getting Boards..')
    const boards = await boardService.query(query, req.loggedinUser._id)
    logger.debug('Boards got successfully!')
    res.json(boards)
  } catch (err) {
    logger.error('Had issues while getting boards', err)
    res.status(500).send({ err: 'Had issues while getting boards' })
  }
}

//? Get - Read
async function getBoardById(req, res) {
  try {
    const boardId = req.params.id
    logger.debug('Getting Board..', boardId)
    const board = await boardService.getById(
      boardId,
      req.loggedinUser._id
    )
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
    logger.debug('Updating Board..', boardId)
    const updatedBoard = await boardService.update(
      board,
      req.loggedinUser._id
    )
    if (!updatedBoard) return res.status(404).send({ err: 'Board not found' })
    logger.debug('Board updated successfully!', boardId)

    socketService.emitTo({ type: 'board-updated', data: board })

    res.json(updatedBoard)
    // res.send(updatedBoard)
  } catch (err) {
    logger.error('Had issues while updating board', err)
    res.status(500).send({ err: 'Had issues while updating board' })
  }
}

//? Remove - Delete
async function removeBoard(req, res) {
  try {
    const boardId = req.params.id
    logger.debug('Removing Board..', boardId)
    const removed = await boardService.remove(boardId, req.loggedinUser._id)
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
