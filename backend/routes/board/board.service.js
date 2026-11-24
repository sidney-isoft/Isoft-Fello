//? Services
const logger = require("../../services/logger.service");
const dbService = require("../../services/db.service");
//? Data
const ObjectId = require("mongodb").ObjectId;
//? Global Variables
const BOARDS_DB = "boards_col";

module.exports = {
  query,
  getById,
  add,
  update,
  remove,
  updateBoardMemberPermission,
  removeBoardMember,
};

//? Query - List/Filtering/Sorting/Paging
// Returns boards owned by the user OR boards where the user is a member with any permission
async function query(filterBy, userId, userRole) {
  try {
    //? DONE: FILTERING/SORTING/PAGING
    const sortCriteria = _buildSortCriteria(filterBy);
    const baseFilter = _buildFilterCriteria(filterBy);

    let filterCriteria;
    // Board admins & global admins see all boards; regular users only see their own, boards they were added to, or public boards
    if (userRole === "globalAdmin" || userRole === "boardAdmin") {
      filterCriteria = baseFilter;
    } else {
      filterCriteria = {
        ...baseFilter,
        $or: [
          { "createdBy._id": userId.toString() },
          { "members._id": userId.toString() },
          { isPublic: true },
        ],
      };
    }

    const collection = await dbService.getCollection(BOARDS_DB);
    let boards = await collection
      .find(filterCriteria)
      .sort(sortCriteria)
      .toArray();

    return _setPage(filterBy, boards);
  } catch (err) {
    logger.error("Cannot find boards", err);
    throw err;
  }
}

//? Create - Save
async function add(board) {
  try {
    const collection = await dbService.getCollection(BOARDS_DB);
    const { insertedId } = await collection.insertOne(board);
    return { ...board, _id: insertedId.toString() };
  } catch (err) {
    logger.error("Cannot insert board", err);
    throw err;
  }
}

//? Update - Edit
async function update(board, userId, userRole) {
  try {
    const {
      title,
      archivedAt,
      createdAt,
      labels,
      style,
      members,
      groups,
      activities,
      isStarred,
      lastViewed,
      isPublic,
      createdBy,
    } = board;
    const boardToSave = {
      title,
      archivedAt,
      createdAt,
      labels,
      style,
      members,
      groups,
      activities,
      isStarred,
      lastViewed,
      isPublic: !!isPublic,
      ...(createdBy ? { createdBy } : {}),
    };

    const collection = await dbService.getCollection(BOARDS_DB);

    // Build the match query: owner can always update; members with Modify/Owner permission can update;
    // boardAdmin/globalAdmin can update any board
    let matchQuery;
    if (userRole === "globalAdmin" || userRole === "boardAdmin") {
      matchQuery = { _id: new ObjectId(board._id) };
    } else {
      matchQuery = {
        _id: new ObjectId(board._id),
        $or: [
          { "createdBy._id": userId.toString() },
          {
            members: {
              $elemMatch: {
                _id: userId.toString(),
                permission: { $in: ["modify", "owner"] },
              },
            },
          },
        ],
      };
    }

    const result = await collection.updateOne(matchQuery, { $set: boardToSave });
    if (!result.matchedCount) return null;
    return board;
  } catch (err) {
    logger.error(`Cannot update board ${board.id}`, err);
    throw err;
  }
}

//? Get - Read
async function getById(boardId, userId, userRole) {
  try {
    if (!ObjectId.isValid(boardId)) return null;
    const collection = await dbService.getCollection(BOARDS_DB);

    let matchQuery;
    if (userRole === "globalAdmin" || userRole === "boardAdmin") {
      matchQuery = { _id: new ObjectId(boardId) };
    } else {
      matchQuery = {
        _id: new ObjectId(boardId),
        $or: [
          { "createdBy._id": userId.toString() },
          { "members._id": userId.toString() },
          { isPublic: true },
        ],
      };
    }

    const board = await collection.findOne(matchQuery);
    return board;
  } catch (err) {
    logger.error(`While finding board ${boardId}:`, err);
    throw err;
  }
}

//? Remove - Delete
async function remove(boardId, userId, userRole) {
  try {
    if (!ObjectId.isValid(boardId)) return false;
    const collection = await dbService.getCollection(BOARDS_DB);

    let matchQuery;
    if (userRole === "globalAdmin" || userRole === "boardAdmin") {
      matchQuery = { _id: new ObjectId(boardId) };
    } else {
      matchQuery = {
        _id: new ObjectId(boardId),
        "createdBy._id": userId.toString(),
      };
    }

    const result = await collection.deleteOne(matchQuery);
    if (!result.deletedCount) return false;
    return boardId;
  } catch (err) {
    logger.error(`Cannot remove board ${boardId}`, err);
    throw err;
  }
}

//? Update a member's permission on a board
async function updateBoardMemberPermission(boardId, memberId, permission, requesterId, requesterRole) {
  try {
    if (!ObjectId.isValid(boardId)) return null;
    const collection = await dbService.getCollection(BOARDS_DB);

    // Only the board owner (createdBy) or globalAdmin/boardAdmin can change permissions
    let matchQuery;
    if (requesterRole === "globalAdmin" || requesterRole === "boardAdmin") {
      matchQuery = { _id: new ObjectId(boardId) };
    } else {
      matchQuery = {
        _id: new ObjectId(boardId),
        $or: [
          { "createdBy._id": requesterId.toString() },
          {
            members: {
              $elemMatch: {
                _id: requesterId.toString(),
                permission: "owner",
              },
            },
          },
        ],
      };
    }

    const result = await collection.updateOne(
      matchQuery,
      {
        $set: { "members.$[member].permission": permission },
      },
      {
        arrayFilters: [
          {
            $or: [
              { "member._id": memberId.toString() },
              ...(ObjectId.isValid(memberId) ? [{ "member._id": new ObjectId(memberId) }] : []),
            ],
          },
        ],
      }
    );

    if (!result.matchedCount) return null;
    return { boardId, memberId, permission };
  } catch (err) {
    logger.error(`Cannot update member permission on board ${boardId}`, err);
    throw err;
  }
}

//? Remove a member from a board
async function removeBoardMember(boardId, memberId, requesterId, requesterRole) {
  try {
    if (!ObjectId.isValid(boardId)) return null;
    const collection = await dbService.getCollection(BOARDS_DB);

    let matchQuery;
    if (requesterRole === "globalAdmin" || requesterRole === "boardAdmin") {
      matchQuery = { _id: new ObjectId(boardId) };
    } else {
      matchQuery = {
        _id: new ObjectId(boardId),
        $or: [
          { "createdBy._id": requesterId.toString() },
          {
            members: {
              $elemMatch: {
                _id: requesterId.toString(),
                permission: "owner",
              },
            },
          },
        ],
      };
    }

    const result = await collection.updateOne(matchQuery, {
      $pull: { members: { _id: memberId.toString() } },
    });

    if (!result.matchedCount) return null;
    return { boardId, memberId };
  } catch (err) {
    logger.error(`Cannot remove member from board ${boardId}`, err);
    throw err;
  }
}

//? Private Functions - Query - List/Filtering/Sorting/Paging

function _buildFilterCriteria(filterBy) {
  const {
    title,
    archivedAt,
    createdAt,
    createdBy,
    labels,
    style,
    members,
    groups,
    activities,
  } = filterBy;
  let criteria = {};
  if (title) criteria.name = { $regex: title ? title : "", $options: "i" };
  if (labels?.length) criteria.labels = { $all: labels.split(",") };
  if (members?.length) criteria.members = { $all: members.split(",") };
  return criteria;
}

function _buildSortCriteria(filterBy) {
  const { sortBy, sortValue } = filterBy;
  return { [sortBy ? sortBy : "createdAt"]: sortValue ? 1 : -1 };
}

function _setPage(filterBy, boards) {
  const { pageSize, pageIdx } = filterBy;
  if (!pageSize) return boards;
  let startIdx = null;
  if (pageIdx !== undefined) startIdx = pageIdx * +pageSize;
  return boards.slice(startIdx, +pageSize + startIdx);
}
