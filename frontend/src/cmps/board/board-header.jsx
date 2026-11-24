import { useEffect, useRef, useState } from 'react'
import { AiOutlineStar } from 'react-icons/ai'
import { AiFillStar } from 'react-icons/ai'
import { BsThreeDots } from 'react-icons/bs'
import { updateBoard } from '../../store/actions/board.actions'
import { BoardMenu } from './side-menu/board-menu'
import { BoardPermissionsModal } from './board-permissions-modal'
import { BoardMemberInfoModal } from './board-member-info-modal'
import { useSelector } from 'react-redux'

export function BoardHeader({ board }) {
  const contentRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStarred, setIsStarred] = useState(board.isStarred)
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false)
  const [selectedMemberInfo, setSelectedMemberInfo] = useState(null)
  const loggedinUser = useSelector((s) => s.userModule.user)

  useEffect(() => { }, [board.isStarred, isStarred])

  function changeContent(ev) {
    board.title = contentRef.current.innerText

    if (ev.key === 'Enter' && !ev.shiftKey) ev.target.blur()
    if (ev.key === 'Enter' || ev.type === 'blur') {
      ev.preventDefault()
      updateBoard(board)
      contentRef.current.contentEditable = false
    }
    contentRef.current.contentEditable = true
  }

  function onStarredBoard() {
    board.isStarred = !board.isStarred
    setIsStarred(!board.isStarred)
    updateBoard(board)
  }

  // Determine if the user can edit this board
  const userMember = board.members?.find((m) => m._id === loggedinUser?._id)
  const isOwner = board.createdBy?._id === loggedinUser?._id
  const canEdit =
    loggedinUser?.role === 'globalAdmin' ||
    loggedinUser?.role === 'boardAdmin' ||
    isOwner ||
    userMember?.permission === 'owner' ||
    userMember?.permission === 'modify'

  return (
    <section
      className={
        isModalOpen ? 'board-header open' : 'board-header'}
    >
      <div className="title-container btn-color" style={board?.style?.isLight ? { color: '#172B4D ' } : { color: 'white' }}>
        <h1
          style={board?.style?.isLight ? { color: '#172B4D ' } : { color: 'white' }}
          ref={contentRef}
          onKeyDown={(ev) => changeContent(ev)}
          onBlur={(ev) => changeContent(ev)}
          contentEditable={canEdit}
          suppressContentEditableWarning={true}
        >
          {board.title}
        </h1>

        {
          <button onClick={onStarredBoard}>
            {board.isStarred ? (
              <AiFillStar className="board-header-starred" />
            ) : (
              <AiOutlineStar className="board-header-star" style={board?.style?.isLight ? { fiil: '#172B4D ' } : { fill: 'white' }} />
            )}
          </button>
        }
      </div>

      <div className="btns-container">
        <div className="members-container">
          {board.members?.map((member, index) => {
            return (
              <div
                key={index}
                className="member-img clickable"
                style={{ zIndex: index, cursor: 'pointer' }}
                onClick={(ev) => {
                  ev.stopPropagation()
                  setSelectedMemberInfo({
                    member,
                    anchorRect: ev.currentTarget.getBoundingClientRect(),
                  })
                }}
              >
                <img
                  src={member.imgUrl}
                  alt={member.fullname}
                  title={`${member.fullname} — click to view info`}
                />
              </div>
            )
          })}
        </div>

        {/* Share / Permissions button */}
        <button
          className="board-header-share-btn"
          style={board?.style?.isLight ? { color: '#172B4D', background: 'rgba(23,43,77,0.1)' } : { color: 'white', background: 'rgba(255,255,255,0.2)' }}
          onClick={() => setIsPermissionsOpen(true)}
          title="Manage board members & permissions"
        >
          Share
        </button>

        <span className="board-header-btn-divider"></span>
        <button
          style={board?.style?.isLight ? { color: '#172B4D ' } : { color: 'white' }}
          className="btns-container-dots-btn"
          onClick={() => {
            setIsModalOpen(!isModalOpen)
          }}
        >
          <BsThreeDots />
        </button>
        {isModalOpen && (
          <BoardMenu
            board={board}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        )}
      </div>

      {isPermissionsOpen && (
        <BoardPermissionsModal
          board={board}
          onClose={() => setIsPermissionsOpen(false)}
        />
      )}

      {selectedMemberInfo && (
        <BoardMemberInfoModal
          member={selectedMemberInfo.member}
          board={board}
          anchorRect={selectedMemberInfo.anchorRect}
          onClose={() => setSelectedMemberInfo(null)}
          onOpenPermissions={canEdit ? () => setIsPermissionsOpen(true) : null}
        />
      )}
    </section>
  )
}
