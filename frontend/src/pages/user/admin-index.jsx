//? Libraries
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
//? Services
import { boardService } from '../../services/board/board.service'
//? Store
import {
  loadUsers,
  removeUser,
  updateUserRole,
  resetUserPassword,
  addUser,
} from '../../store/actions/user.actions'
import {
  showSuccessMsg,
  showErrorMsg,
} from '../../services/connection/event-bus.service'

export function AdminIndex() {
  const users = useSelector((storeState) => storeState.userModule.users || [])
  const loggedinUser = useSelector((storeState) => storeState.userModule.user)
  const navigate = useNavigate()

  const [filterTxt, setFilterTxt] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [resetPwdUserId, setResetPwdUserId] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    fullname: '',
    username: '',
    password: '',
    role: 'user',
  })

  // Delete user & boards modal state
  const [deleteModalData, setDeleteModalData] = useState(null)
  // { user, boards: [] }
  const [boardActions, setBoardActions] = useState({})
  // { [boardId]: { action: 'transfer' | 'makePublic' | 'delete', newOwnerId: '...' } }
  const [isProcessingDelete, setIsProcessingDelete] = useState(false)

  const isGlobalAdmin =
    loggedinUser?.role === 'globalAdmin' || loggedinUser?.isAdmin

  useEffect(() => {
    if (!isGlobalAdmin) {
      navigate('/board', { replace: true })
      return
    }
    loadUsers().catch(() => showErrorMsg('Cannot load users'))
  }, [loggedinUser])

  const filteredUsers = (users || []).filter((u) => {
    const txt = filterTxt.toLowerCase()
    return (
      !txt ||
      u.fullname?.toLowerCase().includes(txt) ||
      u.username?.toLowerCase().includes(txt)
    )
  })

  async function onInitiateDeleteUser(user) {
    if (user._id === loggedinUser?._id) {
      return showErrorMsg('You cannot remove yourself')
    }
    try {
      // Find boards created by this user
      const allBoards = await boardService.query()
      const createdBoards = (allBoards || []).filter(
        (b) =>
          b.createdBy?._id === user._id ||
          b.createdBy?._id?.toString() === user._id?.toString()
      )

      // Find another user to be the default transfer recipient (e.g. current admin)
      const otherUsers = (users || []).filter((u) => u._id !== user._id)
      const defaultOwner =
        otherUsers.find((u) => u._id === loggedinUser?._id) || otherUsers[0]

      const initialActions = {}
      createdBoards.forEach((b) => {
        initialActions[b._id] = {
          action: 'transfer',
          newOwnerId: defaultOwner?._id || '',
        }
      })

      setBoardActions(initialActions)
      setDeleteModalData({ user, boards: createdBoards })
    } catch (err) {
      showErrorMsg('Cannot check user boards')
    }
  }

  async function onConfirmDeleteUser() {
    if (!deleteModalData?.user) return
    const { user, boards } = deleteModalData
    setIsProcessingDelete(true)

    try {
      // Process each board created by this user
      for (const board of boards) {
        const actionInfo = boardActions[board._id] || { action: 'transfer' }

        if (actionInfo.action === 'delete') {
          await boardService.remove(board._id)
        } else if (actionInfo.action === 'makePublic') {
          // Set board to public and remove deleted user from members
          const updatedMembers = (board.members || []).filter(
            (m) => m._id !== user._id
          )
          const updatedBoard = {
            ...board,
            isPublic: true,
            members: updatedMembers,
          }
          await boardService.save(updatedBoard)
        } else if (actionInfo.action === 'transfer') {
          // Transfer ownership to the selected user
          const newOwnerUser = (users || []).find(
            (u) => u._id === actionInfo.newOwnerId
          )
          if (newOwnerUser) {
            const newOwner = {
              _id: newOwnerUser._id.toString(),
              fullname: newOwnerUser.fullname,
              imgUrl: newOwnerUser.imgUrl,
              permission: 'owner',
            }

            // Remove deleted user and ensure new owner is present with 'owner' permission
            let updatedMembers = (board.members || []).filter(
              (m) => m._id !== user._id
            )
            const existingIdx = updatedMembers.findIndex(
              (m) => m._id === newOwnerUser._id
            )
            if (existingIdx >= 0) {
              updatedMembers[existingIdx] = {
                ...updatedMembers[existingIdx],
                permission: 'owner',
              }
            } else {
              updatedMembers.push(newOwner)
            }

            const updatedBoard = {
              ...board,
              createdBy: newOwner,
              members: updatedMembers,
            }
            await boardService.save(updatedBoard)
          }
        }
      }

      // Delete the user
      await removeUser(user._id)
      showSuccessMsg('User and boards processed successfully')
      setDeleteModalData(null)
    } catch (err) {
      showErrorMsg('Error processing user deletion')
    } finally {
      setIsProcessingDelete(false)
    }
  }

  function onSetAllBoardActions(action, newOwnerId = null) {
    if (!deleteModalData?.boards) return
    const updated = {}
    deleteModalData.boards.forEach((b) => {
      updated[b._id] = {
        action,
        newOwnerId:
          newOwnerId ||
          boardActions[b._id]?.newOwnerId ||
          loggedinUser?._id,
      }
    })
    setBoardActions(updated)
  }

  async function onUpdateRole(userId, role) {
    try {
      await updateUserRole(userId, role)
      showSuccessMsg('Role updated successfully')
      setEditingUser(null)
    } catch (err) {
      showErrorMsg('Cannot update role')
    }
  }

  async function onResetPassword(ev) {
    ev.preventDefault()
    if (!newPassword.trim()) return showErrorMsg('Enter a new password')
    try {
      await resetUserPassword(resetPwdUserId, newPassword)
      showSuccessMsg('Password reset successfully')
      setResetPwdUserId(null)
      setNewPassword('')
    } catch (err) {
      showErrorMsg('Cannot reset password')
    }
  }

  async function handleAddUser(ev) {
    ev.preventDefault()
    const { fullname, username, password, role } = newUser
    if (!fullname.trim() || !username.trim() || !password.trim()) {
      return showErrorMsg('Please fill in all required fields')
    }
    try {
      await addUser({
        fullname: fullname.trim(),
        username: username.trim(),
        password: password.trim(),
        role: role || 'user',
      })
      showSuccessMsg('User added successfully')
      setNewUser({ fullname: '', username: '', password: '', role: 'user' })
      setIsAddUserOpen(false)
    } catch (err) {
      showErrorMsg(err.message || 'Cannot add user')
    }
  }

  function getRoleBadgeClass(role) {
    switch (role) {
      case 'globalAdmin':
        return 'role-badge role-global-admin'
      case 'boardAdmin':
        return 'role-badge role-board-admin'
      default:
        return 'role-badge role-user'
    }
  }

  function getRoleLabel(role) {
    switch (role) {
      case 'globalAdmin':
        return 'Global Admin'
      case 'boardAdmin':
        return 'Board Admin'
      default:
        return 'User'
    }
  }

  return (
    <section className="admin-index-section">
      <div className="admin-header">
        <div className="admin-header-title">
          <h1>User Management</h1>
          <p className="admin-subtitle">
            Manage users, assign roles, and reset passwords
          </p>
        </div>
        <button
          className="admin-btn admin-btn-edit add-user-btn"
          onClick={() => setIsAddUserOpen(!isAddUserOpen)}
        >
          {isAddUserOpen ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {isAddUserOpen && (
        <form className="admin-add-user-form" onSubmit={handleAddUser}>
          <h3>Add New User</h3>
          <div className="add-user-inputs">
            <input
              type="text"
              placeholder="Full Name *"
              value={newUser.fullname}
              onChange={(e) =>
                setNewUser({ ...newUser, fullname: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Username *"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password *"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              required
            />
            <select
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value })
              }
            >
              <option value="user">User</option>
              <option value="boardAdmin">Board Admin</option>
              <option value="globalAdmin">Global Admin</option>
            </select>
            <button type="submit" className="admin-btn admin-btn-edit">
              Save User
            </button>
          </div>
        </form>
      )}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Search by name or username..."
          value={filterTxt}
          onChange={(e) => setFilterTxt(e.target.value)}
        />
        <span className="admin-user-count">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bulleted roles description with labels */}
      <ul className="admin-roles-legend">
        <li>
          <span className="role-badge role-global-admin">Global Admin</span>
          <span className="legend-desc">
            Full access: manage users, roles, all boards, and reset passwords
          </span>
        </li>
        <li>
          <span className="role-badge role-board-admin">Board Admin</span>
          <span className="legend-desc">Can manage all boards</span>
        </li>
        <li>
          <span className="role-badge role-user">User</span>
          <span className="legend-desc">
            Regular user: only has access to manage their own boards or boards they were granted access to
          </span>
        </li>
      </ul>

      {filteredUsers.length === 0 ? (
        <div className="admin-empty">No users found</div>
      ) : (
        <ul className="admin-user-list">
          {filteredUsers.map((user) => (
            <li key={user._id} className="admin-user-item">
              <div className="admin-user-info">
                <div className="admin-user-meta">
                  <img
                    src={
                      user.imgUrl ||
                      'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'
                    }
                    alt={user.fullname}
                    className="admin-user-avatar"
                  />
                  <div className="admin-user-details">
                    <span className="admin-user-name">
                      {user.fullname}
                      {user._id === loggedinUser?._id && ' (You)'}
                    </span>
                    <span className="admin-user-username">@{user.username}</span>
                  </div>
                </div>
                <span className={getRoleBadgeClass(user.role)}>
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <div className="admin-user-actions">
                {editingUser === user._id ? (
                  <div className="admin-role-edit">
                    <span className="admin-label">Change role:</span>
                    {['user', 'boardAdmin', 'globalAdmin'].map((role) => (
                      <button
                        key={role}
                        className={`admin-role-btn${
                          (user.role || 'user') === role ? ' active' : ''
                        }`}
                        onClick={() => onUpdateRole(user._id, role)}
                      >
                        {getRoleLabel(role)}
                      </button>
                    ))}
                    <button
                      className="admin-btn admin-btn-cancel"
                      onClick={() => setEditingUser(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="admin-btn admin-btn-edit"
                      onClick={() => setEditingUser(user._id)}
                      title="Change role"
                    >
                      Change Role
                    </button>
                    <button
                      className="admin-btn admin-btn-pwd"
                      onClick={() => {
                        setResetPwdUserId(user._id)
                        setNewPassword('')
                      }}
                      title="Reset password"
                    >
                      Reset Password
                    </button>
                    {user._id !== loggedinUser?._id && (
                      <button
                        className="admin-btn admin-btn-remove"
                        onClick={() => onInitiateDeleteUser(user)}
                        title="Remove user"
                      >
                        Remove
                      </button>
                    )}
                  </>
                )}
              </div>

              {resetPwdUserId === user._id && (
                <form className="admin-reset-pwd" onSubmit={onResetPassword}>
                  <span className="admin-label">
                    New password for {user.username}:
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password..."
                    minLength={4}
                    required
                  />
                  <button type="submit" className="admin-btn admin-btn-edit">
                    Set Password
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-cancel"
                    onClick={() => setResetPwdUserId(null)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Delete User & Manage Boards Modal */}
      {deleteModalData && (
        <div className="delete-user-overlay">
          <div className="delete-user-modal">
            <div className="delete-modal-header">
              <h3>Delete User: {deleteModalData.user.fullname}</h3>
              <button
                className="delete-modal-close"
                onClick={() => setDeleteModalData(null)}
              >
                ✕
              </button>
            </div>

            <div className="delete-modal-body">
              {deleteModalData.boards.length === 0 ? (
                <div className="delete-no-boards">
                  <p>
                    Are you sure you want to delete user{' '}
                    <strong>{deleteModalData.user.fullname}</strong> (@
                    {deleteModalData.user.username})?
                  </p>
                  <p className="delete-subtext">
                    This user has not created any boards. Their account will be permanently removed.
                  </p>
                </div>
              ) : (
                <div className="delete-has-boards">
                  <div className="delete-warning-banner">
                    ⚠️ <strong>{deleteModalData.user.fullname}</strong> is the creator of{' '}
                    <strong>{deleteModalData.boards.length}</strong> board(s). Choose what to do with each board before deleting the account:
                  </div>

                  {/* Quick-apply bar */}
                  <div className="quick-actions-bar">
                    <span className="quick-actions-label">Apply to all boards:</span>
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => onSetAllBoardActions('transfer')}
                    >
                      Transfer All
                    </button>
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => onSetAllBoardActions('makePublic')}
                    >
                      Make All Public
                    </button>
                    <button
                      type="button"
                      className="quick-action-btn quick-action-danger"
                      onClick={() => onSetAllBoardActions('delete')}
                    >
                      Delete All Boards
                    </button>
                  </div>

                  <ul className="delete-boards-list">
                    {deleteModalData.boards.map((b) => {
                      const currentAction = boardActions[b._id]?.action || 'transfer'
                      const currentOwnerId = boardActions[b._id]?.newOwnerId || loggedinUser?._id
                      const otherUsers = (users || []).filter(
                        (u) => u._id !== deleteModalData.user._id
                      )

                      return (
                        <li key={b._id} className="delete-board-item">
                          <div className="delete-board-meta">
                            <span
                              className="delete-board-thumb"
                              style={
                                b.style?.backgroundImg
                                  ? {
                                      background: `url(${b.style.backgroundImg}) center/cover`,
                                    }
                                  : { background: b.style?.bgColor || '#0079bf' }
                              }
                            />
                            <span className="delete-board-title">{b.title}</span>
                          </div>

                          <div className="delete-board-options">
                            <label className="delete-option-label">
                              <input
                                type="radio"
                                name={`board-action-${b._id}`}
                                value="transfer"
                                checked={currentAction === 'transfer'}
                                onChange={() =>
                                  setBoardActions({
                                    ...boardActions,
                                    [b._id]: {
                                      ...boardActions[b._id],
                                      action: 'transfer',
                                    },
                                  })
                                }
                              />
                              <span>Transfer Ownership to:</span>
                              <select
                                disabled={currentAction !== 'transfer'}
                                value={currentOwnerId}
                                onChange={(e) =>
                                  setBoardActions({
                                    ...boardActions,
                                    [b._id]: {
                                      ...boardActions[b._id],
                                      action: 'transfer',
                                      newOwnerId: e.target.value,
                                    },
                                  })
                                }
                                className="delete-owner-select"
                              >
                                {otherUsers.map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.fullname} (@{u.username})
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="delete-option-label">
                              <input
                                type="radio"
                                name={`board-action-${b._id}`}
                                value="makePublic"
                                checked={currentAction === 'makePublic'}
                                onChange={() =>
                                  setBoardActions({
                                    ...boardActions,
                                    [b._id]: {
                                      ...boardActions[b._id],
                                      action: 'makePublic',
                                    },
                                  })
                                }
                              />
                              <span>Make Public (all users can see it)</span>
                            </label>

                            <label className="delete-option-label label-danger">
                              <input
                                type="radio"
                                name={`board-action-${b._id}`}
                                value="delete"
                                checked={currentAction === 'delete'}
                                onChange={() =>
                                  setBoardActions({
                                    ...boardActions,
                                    [b._id]: {
                                      ...boardActions[b._id],
                                      action: 'delete',
                                    },
                                  })
                                }
                              />
                              <span>Delete Board Completely</span>
                            </label>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-cancel"
                onClick={() => setDeleteModalData(null)}
                disabled={isProcessingDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={onConfirmDeleteUser}
                disabled={isProcessingDelete}
              >
                {isProcessingDelete
                  ? 'Processing...'
                  : deleteModalData.boards.length > 0
                  ? 'Confirm & Delete User'
                  : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
