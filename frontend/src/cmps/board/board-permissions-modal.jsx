import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { boardService } from '../../services/board/board.service'
import { userService } from '../../services/user/user.service'
import { updateBoard } from '../../store/actions/board.actions'
import {
  showSuccessMsg,
  showErrorMsg,
} from '../../services/connection/event-bus.service'

const PERMISSIONS = ['read', 'modify', 'owner']

function getPermissionLabel(p) {
  switch (p) {
    case 'read': return 'Read'
    case 'modify': return 'Modify'
    case 'owner': return 'Owner'
    default: return 'Read'
  }
}

export function BoardPermissionsModal({ board, onClose }) {
  const loggedinUser = useSelector((s) => s.userModule.user)
  const [allUsers, setAllUsers] = useState([])
  const [searchTxt, setSearchTxt] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [localBoard, setLocalBoard] = useState(board)
  const modalRef = useRef()

  // Determine if the current user can manage permissions
  const canManage =
    loggedinUser?.role === 'globalAdmin' ||
    loggedinUser?.role === 'boardAdmin' ||
    localBoard.createdBy?._id === loggedinUser?._id ||
    localBoard.members?.find(
      (m) => m._id === loggedinUser?._id && m.permission === 'owner'
    )

  useEffect(() => {
    userService.getUsers().then(setAllUsers).catch(console.error)

    function onClickOutside(ev) {
      if (modalRef.current && !modalRef.current.contains(ev.target)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!searchTxt.trim()) {
      setSearchResults([])
      return
    }
    const txt = searchTxt.toLowerCase()
    const existing = new Set(localBoard.members?.map((m) => m._id) || [])
    setSearchResults(
      allUsers.filter(
        (u) =>
          !existing.has(u._id) &&
          (u.fullname?.toLowerCase().includes(txt) ||
            u.username?.toLowerCase().includes(txt))
      )
    )
  }, [searchTxt, allUsers, localBoard.members])

  useEffect(() => {
    setLocalBoard(board)
  }, [board])

  async function onAddMember(user) {
    try {
      const newMember = {
        _id: user._id,
        fullname: user.fullname,
        imgUrl: user.imgUrl,
        permission: 'read',
      }
      const updatedBoard = {
        ...localBoard,
        members: [...(localBoard.members || []), newMember],
      }
      setLocalBoard(updatedBoard)
      await updateBoard(updatedBoard)
      setSearchTxt('')
      showSuccessMsg(`${user.fullname} added to board`)
    } catch (err) {
      showErrorMsg('Cannot add member')
    }
  }

  async function onChangePermission(memberId, newPermission) {
    try {
      const updatedMembers = (localBoard.members || []).map((m) =>
        m._id === memberId ? { ...m, permission: newPermission } : m
      )
      const updatedBoard = { ...localBoard, members: updatedMembers }
      setLocalBoard(updatedBoard)
      await updateBoard(updatedBoard)
      showSuccessMsg('Permission updated')
    } catch (err) {
      showErrorMsg('Cannot update permission')
    }
  }

  async function onRemoveMember(memberId) {
    try {
      const updatedMembers = (localBoard.members || []).filter((m) => m._id !== memberId)
      const updatedBoard = { ...localBoard, members: updatedMembers }
      setLocalBoard(updatedBoard)
      await updateBoard(updatedBoard)
      showSuccessMsg('Member removed')
    } catch (err) {
      showErrorMsg('Cannot remove member')
    }
  }

  return (
    <div className="board-permissions-overlay">
      <div className="board-permissions-modal" ref={modalRef}>
        <div className="perm-modal-header">
          <h3>Board Members & Permissions</h3>
          <button className="perm-modal-close" onClick={onClose}>✕</button>
        </div>

        {canManage && (
          <div className="perm-add-member">
            <input
              type="text"
              placeholder="Add member by name or username..."
              value={searchTxt}
              onChange={(e) => setSearchTxt(e.target.value)}
            />
            {searchResults.length > 0 && (
              <ul className="perm-search-results">
                {searchResults.map((u) => (
                  <li key={u._id} onClick={() => onAddMember(u)}>
                    <img
                      src={u.imgUrl || 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'}
                      alt={u.fullname}
                    />
                    <span className="perm-search-name">{u.fullname}</span>
                    <span className="perm-search-username">@{u.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ul className="perm-member-list">
          {localBoard.members?.map((member) => {
            const isOwnerCreator = localBoard.createdBy?._id === member._id
            const isMe = member._id === loggedinUser?._id
            return (
              <li key={member._id} className="perm-member-item">
                <img
                  src={member.imgUrl || 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'}
                  alt={member.fullname}
                  className="perm-member-avatar"
                />
                <div className="perm-member-info">
                  <span className="perm-member-name">
                    {member.fullname}
                    {isMe && <span className="perm-you-badge"> (you)</span>}
                  </span>
                  {isOwnerCreator && (
                    <span className="perm-creator-badge">Creator</span>
                  )}
                </div>
                <div className="perm-member-controls">
                  {canManage && !isOwnerCreator ? (
                    <>
                      <select
                        value={member.permission || 'read'}
                        onChange={(e) => onChangePermission(member._id, e.target.value)}
                        className="perm-select"
                      >
                        {PERMISSIONS.map((p) => (
                          <option key={p} value={p}>
                            {getPermissionLabel(p)}
                          </option>
                        ))}
                      </select>
                      {!isMe && (
                        <button
                          className="perm-remove-btn"
                          onClick={() => onRemoveMember(member._id)}
                          title="Remove from board"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="perm-label">
                      {getPermissionLabel(member.permission || 'owner')}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
