const express = require('express');
const {
  createGroup,
  getUserGroups,
  getPendingInvites,
  respondToInvite,
  searchUsers,
  addMembersToGroup,
  getGroupMembers
} = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createGroup);
router.get('/', getUserGroups);
router.get('/invites', getPendingInvites);
router.get('/search/users', searchUsers);
router.get('/:groupId/members', getGroupMembers);
router.post('/:groupId/respond', respondToInvite);
router.post('/:groupId/add-members', addMembersToGroup);

module.exports = router;