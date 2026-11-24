const USER_ROLES = ['globalAdmin', 'boardAdmin', 'user']
const BOARD_PERMISSIONS = ['read', 'modify', 'owner']
const PERMISSION_LEVELS = { read: 1, modify: 2, owner: 3 }

module.exports = {
  USER_ROLES,
  BOARD_PERMISSIONS,
  getUserRole,
  getBoardPermission,
  hasBoardPermission,
}

function getUserRole(user) {
  if (USER_ROLES.includes(user?.role)) return user.role
  return user?.isAdmin ? 'globalAdmin' : 'user'
}

function getBoardPermission(board, user) {
  const role = getUserRole(user)
  if (role === 'globalAdmin' || role === 'boardAdmin') return 'owner'

  const userId = user?._id?.toString()
  if (!userId) return null

  const creatorId = board?.createdBy?._id?.toString()
  if (board?.accessVersion !== 1 && creatorId === userId) return 'owner'

  const member = board?.members?.find(
    (boardMember) => boardMember?._id?.toString() === userId
  )
  if (!member) return null
  return BOARD_PERMISSIONS.includes(member.permission)
    ? member.permission
    : 'read'
}

function hasBoardPermission(actualPermission, requiredPermission) {
  return (
    PERMISSION_LEVELS[actualPermission] >=
    PERMISSION_LEVELS[requiredPermission]
  )
}
