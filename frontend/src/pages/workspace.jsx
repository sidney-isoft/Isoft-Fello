import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { BoardList } from '../cmps/workspace/board-list'
import {
  showErrorMsg,
  showSuccessMsg,
} from '../services/connection/event-bus.service'
import { AiOutlineStar, AiOutlineClockCircle } from 'react-icons/ai'
import { loadBoards } from '../store/actions/board.actions'
import { Loader } from '../cmps/helpers/loader'
import { UPDATE_BOARD } from '../store/reducers/board.reducer'
import { socketService, SOCKET_EVENT_BOARD_UPDATED } from '../services/connection/socket.service'

export function Workspace() {
  const boards = useSelector((storeState) => storeState.boardModule.boards)
  const dispatch = useDispatch()

  useEffect(() => {
    socketService.on(SOCKET_EVENT_BOARD_UPDATED, socketUpdateBoard)
    return () => {
      socketService.off(SOCKET_EVENT_BOARD_UPDATED, socketUpdateBoard)
    }
  }, [])

  function socketUpdateBoard(updatedBoard) {
    dispatch({ type: UPDATE_BOARD, board: updatedBoard })
  }

  useEffect(() => {
    onLoadBoards()
  }, [])

  async function onLoadBoards() {
    try {
      await loadBoards()
      showSuccessMsg('Boards loaded')
    } catch (err) {
      showErrorMsg('Cannot load boards')
    }
  }

  // Guard against non-array boards state before calling .filter
  if (!boards || !Array.isArray(boards)) return <Loader />

  const starredBoard = boards.filter((board) => board?.isStarred)
  const day = 1000 * 60 * 60 * 24
  const recentlyViewedBoard = boards.filter(
    (board) => Date.now() - (board?.lastViewed || 0) < day
  )

  function onStarredBoard() {
    if (!starredBoard.length) return
    return (
      <h1>
        <AiOutlineStar className="workspace-icons" /> Starred boards
      </h1>
    )
  }

  function onRecentlyViewedBoard() {
    if (!recentlyViewedBoard.length) return
    return (
      <h1>
        <AiOutlineClockCircle className="workspace-icons" /> Recently viewed
      </h1>
    )
  }

  return (
    <section className="workspace-section">
      <div className="starred-boards-container">
        {onStarredBoard()}
        <BoardList boards={starredBoard} />
      </div>
      <div className="recently-viewed-boards-container">
        {onRecentlyViewedBoard()}
        <BoardList boards={recentlyViewedBoard} />
      </div>
      <div className="your-workspace-boards-container">
        <h3>Your workspaces</h3>
        <BoardList
          boards={boards}
          createBoardPlaceholder={true}
        />
      </div>
    </section>
  )
}
