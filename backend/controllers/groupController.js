const Group = require('../models/Group');
const User = require('../models/User');

exports.addMembersToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberEmails } = req.body;

    console.log('Adding members to group:', groupId, 'Emails:', memberEmails);

    // Verify group exists and user is the creator
    const group = await Group.findOne({
      _id: groupId,
      createdBy: req.user._id
    });

    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found or you are not the creator' 
      });
    }

    // Add members by email
    if (memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      
      let addedCount = 0;
      users.forEach(user => {
        // Check if user is already a member (accepted, pending, or rejected)
        const isAlreadyMember = group.members.some(m => m.user.equals(user._id));
        const isRejected = group.rejectedInvites.some(r => r.user.equals(user._id));
        
        if (!isAlreadyMember && !isRejected && !user._id.equals(req.user._id)) {
          group.members.push({
            user: user._id,
            status: 'pending'
          });
          addedCount++;
        }
      });

      await group.save();
      await group.populate('members.user', 'name email mobile')
                 .populate('rejectedInvites.user', 'name email mobile');

      res.json({
        message: `Invited ${addedCount} new member(s) to the group`,
        group
      });
    } else {
      res.status(400).json({
        message: 'No valid member emails provided'
      });
    }
  } catch (error) {
    console.error('Error adding members to group:', error);
    res.status(500).json({
      message: 'Error adding members to group',
      error: error.message
    });
  }
};

// Create group
// Create group - FIXED VERSION
exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberEmails = [] } = req.body;

    console.log('Creating group with data:', { name, description, memberEmails });

    const group = new Group({
      name,
      description,
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        status: 'accepted',
        joinedAt: new Date()
      }]
    });

    // Add members by email
    if (memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      console.log('Found users to add:', users.length);
      
      users.forEach(user => {
        if (!user._id.equals(req.user._id)) {
          group.members.push({
            user: user._id,
            status: 'pending'
          });
        }
      });
    }

    await group.save();
    console.log('Group saved successfully:', group._id);

    // FIXED: Proper population - do one populate at a time
    await group.populate('members.user', 'name email mobile');
    await group.populate('createdBy', 'name email');

    console.log('Group populated successfully');

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      message: 'Error creating group',
      error: error.message
    });
  }
};

// Get user's groups
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      'members.status': 'accepted'
    })
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email mobile')
    .populate('rejectedInvites.user', 'name email mobile')
    .populate('expenses')
    .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// Get pending invites
exports.getPendingInvites = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      'members.status': 'pending'
    })
    .populate('createdBy', 'name email')
    .populate('members.user', 'name email mobile')
    .populate('rejectedInvites.user', 'name email mobile');

    res.json(groups);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching pending invites',
      error: error.message
    });
  }
};

// Get group members - NEW ENDPOINT
// Get group members - IMPROVED VERSION
// Get group members - IMPROVED VERSION
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    console.log('Fetching members for group:', groupId);

    // Check if user is a member of this group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user._id
    });

    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found or you are not a member' 
      });
    }

    // Now populate the members
    await group.populate('members.user', 'name email mobile');
    await group.populate('createdBy', 'name email');

    // Return only accepted members
    const acceptedMembers = group.members.filter(m => m.status === 'accepted');
    
    console.log('Found accepted members:', acceptedMembers.length);

    res.json({
      members: acceptedMembers.map(m => m.user),
      createdBy: group.createdBy
    });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({
      message: 'Error fetching group members',
      error: error.message
    });
  }
};

// Accept/reject invite
exports.respondToInvite = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user._id,
      'members.status': 'pending'
    });

    if (!group) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    const memberIndex = group.members.findIndex(m => 
      m.user.equals(req.user._id)
    );

    if (action === 'accept') {
      group.members[memberIndex].status = 'accepted';
      group.members[memberIndex].joinedAt = new Date();
      group.members[memberIndex].respondedAt = new Date();
      await group.save();
      
      await group.populate('members.user', 'name email mobile');
      
      res.json({ message: 'Invite accepted successfully', group });
    } else if (action === 'reject') {
      // Move to rejected invites before removing
      const rejectedUser = group.members[memberIndex].user;
      
      group.rejectedInvites.push({
        user: rejectedUser,
        rejectedAt: new Date()
      });
      
      // Remove from members array
      group.members.splice(memberIndex, 1);
      await group.save();
      
      await group.populate('rejectedInvites.user', 'name email mobile');
      
      res.json({ 
        message: 'Invite rejected successfully',
        rejectedUser: group.rejectedInvites[group.rejectedInvites.length - 1]
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error processing invite',
      error: error.message
    });
  }
};

// Search users for invitation - FIXED VERSION
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { email: { $regex: query, $options: 'i' } },
            { mobile: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email mobile _id').limit(10);

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      message: 'Error searching users',
      error: error.message
    });
  }
};