import { useEffect, useRef, useState } from 'react'
import { userService } from '../../services/user/user.service'

export function BoardMemberInfoModal({
  member,
  board,
  onClose,
  onOpenPermissions,
  anchorRect,
}) {
  const modalRef = useRef()
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    // Attempt to load full user details (username, role, etc.)
    if (member._id) {
      userService
        .getById(member._id)
        .then((u) => setUserInfo(u))
        .catch(() => {})
    }

    function onClickOutside(ev) {
      if (modalRef.current && !modalRef.current.contains(ev.target)) {
        onClose()
      }
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [member._id])

  const isCreator =
    board.createdBy?._id === member._id ||
    board.createdBy?._id?.toString() === member._id?.toString()

  const permission = member.permission || (isCreator ? 'owner' : 'read')

  function getPermissionBadge(p) {
    switch (p) {
      case 'owner':
        return { label: 'Owner', className: 'perm-badge perm-owner' }
      case 'modify':
        return { label: 'Modify', className: 'perm-badge perm-modify' }
      default:
        return { label: 'Read', className: 'perm-badge perm-read' }
    }
  }

  function getAppRoleBadge(role) {
    switch (role) {
      case 'globalAdmin':
        return { label: 'Global Admin', className: 'role-badge role-global-admin' }
      case 'boardAdmin':
        return { label: 'Board Admin', className: 'role-badge role-board-admin' }
      default:
        return { label: 'User', className: 'role-badge role-user' }
    }
  }

  const permBadge = getPermissionBadge(permission)
  const roleBadge = getAppRoleBadge(userInfo?.role || member.role || 'user')

  return (
    <div
      className="board-member-info-modal"
      ref={modalRef}
      style={
        anchorRect
          ? {
              top: `${anchorRect.bottom + 8}px`,
              left: `${Math.max(12, anchorRect.left - 120)}px`,
            }
          : {}
      }
    >
      <div className="member-info-header">
        <h4>Member Info</h4>
        <button className="member-info-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="member-info-body">
        <img
          src={
            member.imgUrl ||
            'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png'
          }
          alt={member.fullname}
          className="member-info-avatar"
        />
        <div className="member-info-names">
          <span className="member-info-fullname">{member.fullname}</span>
          <span className="member-info-username">
            @{userInfo?.username || member.username || 'user'}
          </span>
        </div>

        <div className="member-info-badges">
          <div className="info-badge-row">
            <span className="info-badge-label">Board Permission:</span>
            <span className={permBadge.className}>{permBadge.label}</span>
          </div>
          <div className="info-badge-row">
            <span className="info-badge-label">App Role:</span>
            <span className={roleBadge.className}>{roleBadge.label}</span>
          </div>
          {isCreator && (
            <div className="info-badge-row">
              <span className="info-badge-label">Ownership:</span>
              <span className="board-creator-pill">Board Creator</span>
            </div>
          )}
        </div>

        {onOpenPermissions && (
          <button
            className="member-info-manage-btn"
            onClick={() => {
              onClose()
              onOpenPermissions()
            }}
          >
            Manage Permissions
          </button>
        )}
      </div>
    </div>
  )
}
