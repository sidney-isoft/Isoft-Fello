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
};

//? Query - List/Filtering/Sorting/Paging
async function query(query, ownerId) {
  try {
    //? DONE: FILTERING/SORTING/PAGING
    const sortCriteria = _buildSortCriteria(query);
    const filterCriteria = {
      ..._buildFilterCriteria(query),
      "createdBy._id": ownerId.toString(),
    };
    const collection = await dbService.getCollection(BOARDS_DB);
    let boards = await collection
      .find(filterCriteria)
      .sort(sortCriteria)
      .toArray();

    return _setPage(query, boards);
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
async function update(board, ownerId) {
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
    };
    const collection = await dbService.getCollection(BOARDS_DB);
    const result = await collection.updateOne(
      {
        _id: new ObjectId(board._id),
        "createdBy._id": ownerId.toString(),
      },
      { $set: boardToSave }
    );
    if (!result.matchedCount) return null;
    return board;
  } catch (err) {
    logger.error(`Cannot update board ${board.id}`, err);
    throw err;
  }
}

//? Get - Read
async function getById(boardId, ownerId) {
  try {
    if (!ObjectId.isValid(boardId)) return null;
    const collection = await dbService.getCollection(BOARDS_DB);
    const board = await collection.findOne({
      _id: new ObjectId(boardId),
      "createdBy._id": ownerId.toString(),
    });
    // TODO: Return error if boardId is not found
    return board;
  } catch (err) {
    logger.error(`While finding board ${boardId}:`, err);
    throw err;
  }
}

//? Remove - Delete
async function remove(boardId, ownerId) {
  try {
    if (!ObjectId.isValid(boardId)) return false;
    const collection = await dbService.getCollection(BOARDS_DB);
    const result = await collection.deleteOne({
      _id: new ObjectId(boardId),
      "createdBy._id": ownerId.toString(),
    });
    if (!result.deletedCount) return false;
    // TODO: Return error if boardId is not found
    return boardId;
  } catch (err) {
    logger.error(`Cannot remove board ${boardId}`, err);
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
