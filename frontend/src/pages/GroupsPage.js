import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const GroupsPage = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    memberEmails: []
  });
  const [newMemberEmails, setNewMemberEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/groups/search/users?query=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/groups', newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', memberEmails: [] });
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (!selectedGroup || newMemberEmails.length === 0) return;

    setAddMemberLoading(true);

    try {
      // Call backend API to add members to existing group
      await api.post(`/groups/${selectedGroup._id}/add-members`, {
        memberEmails: newMemberEmails
      });
      
      setShowAddMemberModal(false);
      setSelectedGroup(null);
      setNewMemberEmails([]);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroups(); // Refresh groups data
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const openAddMemberModal = (group) => {
    setSelectedGroup(group);
    setShowAddMemberModal(true);
  };

  const closeAddMemberModal = () => {
    setShowAddMemberModal(false);
    setSelectedGroup(null);
    setNewMemberEmails([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addMemberEmail = (email) => {
    if (!newMemberEmails.includes(email)) {
      setNewMemberEmails([...newMemberEmails, email]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMemberEmail = (email) => {
    setNewMemberEmails(newMemberEmails.filter(e => e !== email));
  };

  const addMemberEmailToNewGroup = (email) => {
    if (!newGroup.memberEmails.includes(email)) {
      setNewGroup({
        ...newGroup,
        memberEmails: [...newGroup.memberEmails, email]
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeMemberEmailFromNewGroup = (email) => {
    setNewGroup({
      ...newGroup,
      memberEmails: newGroup.memberEmails.filter(e => e !== email)
    });
  };

  // Helper function to compare IDs
  const compareIds = (id1, id2) => {
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
  };

  // Check if current user is group creator
  const isGroupCreator = (group) => {
    return compareIds(group.createdBy?._id, user.id);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create New Group
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group._id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{group.name}</h3>
                {group.description && (
                  <p className="text-gray-500 text-sm mb-4">{group.description}</p>
                )}
                
                {/* Group Members Status */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Members:</h4>
                  <div className="space-y-1">
                    {/* Accepted Members */}
                    {group.members?.filter(m => m.status === 'accepted').map((member) => (
                      <div key={member.user._id} className="flex items-center text-sm">
                        <span className="text-green-600">✓</span>
                        <span className="ml-2 text-gray-600">
                          {member.user.name}
                          {compareIds(member.user._id, user.id) && ' (You)'}
                          {compareIds(member.user._id, group.createdBy._id) && ' 👑'}
                        </span>
                      </div>
                    ))}
                    
                    {/* Pending Invites */}
                    {group.members?.filter(m => m.status === 'pending').map((member) => (
                      <div key={member.user._id} className="flex items-center text-sm">
                        <span className="text-yellow-500">⏳</span>
                        <span className="ml-2 text-gray-500">
                          {member.user.name} - Pending
                        </span>
                      </div>
                    ))}
                    
                    {/* Rejected Invites */}
                    {group.rejectedInvites?.map((rejected, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="text-red-500">✗</span>
                        <span className="ml-2 text-gray-400 line-through">
                          {rejected.user.name} - Rejected
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    {group.members?.filter(m => m.status === 'accepted').length || 0} active members
                  </span>
                  <span>{group.expenses?.length || 0} expenses</span>
                </div>
                
                {/* Group Status Summary */}
                <div className="mb-4 text-xs text-gray-500">
                  {group.members?.filter(m => m.status === 'pending').length > 0 && (
                    <div className="mb-1">
                      {group.members.filter(m => m.status === 'pending').length} pending invitation(s)
                    </div>
                  )}
                  {group.rejectedInvites?.length > 0 && (
                    <div className="text-red-500">
                      {group.rejectedInvites.length} rejected invitation(s)
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/reports/${group._id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm"
                  >
                    View Report
                  </Link>
                  
                  {/* Add Members Button - Only show for group creator */}
                  {isGroupCreator(group) && (
                    <button
                      onClick={() => openAddMemberModal(group)}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm"
                      title="Add more members"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No groups yet</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium"
            >
              Create Your First Group
            </button>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Group</h3>
                
                <form onSubmit={handleCreateGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invite Members by Email
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="mt-1 border border-gray-300 rounded-md bg-white max-h-32 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => addMemberEmailToNewGroup(user.email)}
                          >
                            {user.name} ({user.email})
                          </div>
                        ))}
                      </div>
                    )}

                    {newGroup.memberEmails.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newGroup.memberEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {email}
                            <button
                              type="button"
                              className="ml-1 hover:bg-blue-200 rounded-full"
                              onClick={() => removeMemberEmailFromNewGroup(email)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Members Modal */}
        {showAddMemberModal && selectedGroup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Members to {selectedGroup.name}
                </h3>
                
                <form onSubmit={handleAddMembers}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invite Members by Email
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="mt-1 border border-gray-300 rounded-md bg-white max-h-32 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => addMemberEmail(user.email)}
                          >
                            {user.name} ({user.email})
                          </div>
                        ))}
                      </div>
                    )}

                    {newMemberEmails.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newMemberEmails.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {email}
                            <button
                              type="button"
                              className="ml-1 hover:bg-green-200 rounded-full"
                              onClick={() => removeMemberEmail(email)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeAddMemberModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addMemberLoading || newMemberEmails.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addMemberLoading ? 'Adding...' : 'Add Members'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
