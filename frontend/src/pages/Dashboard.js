import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard mounted, user:', user);
    console.log('Token in localStorage:', localStorage.getItem('token'));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [groupsResponse, invitesResponse] = await Promise.all([
        api.get('/groups'),
        api.get('/groups/invites')
      ]);
      
      setGroups(groupsResponse.data);
      setPendingInvites(invitesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        // Don't automatically redirect - let user see the error
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInviteResponse = async (groupId, action) => {
    try {
      await api.post(`/groups/${groupId}/respond`, { action });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error responding to invite:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  // Helper function to compare IDs
  const compareIds = (id1, id2) => {
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* User Profile */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Mobile</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.mobile}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Groups */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Groups</h3>
              <Link
                to="/groups"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Manage Groups
              </Link>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {groups.slice(0, 5).map((group) => (
                  <li key={group._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-500">
                          {group.members?.filter(m => m.status === 'accepted').length || 0} active members
                          {group.rejectedInvites?.length > 0 && (
                            <span className="ml-2 text-red-500">
                              • {group.rejectedInvites.length} rejected
                            </span>
                          )}
                          {group.members?.filter(m => m.status === 'pending').length > 0 && (
                            <span className="ml-2 text-yellow-500">
                              • {group.members.filter(m => m.status === 'pending').length} pending
                            </span>
                          )}
                        </p>
                        {/* Show group creator info */}
                        {group.createdBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            Created by {group.createdBy.name}
                            {compareIds(group.createdBy._id, user.id) && ' (You)'}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/reports/${group._id}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm"
                      >
                        View Report
                      </Link>
                    </div>
                  </li>
                ))}
                {groups.length === 0 && (
                  <li className="px-4 py-4 text-center text-gray-500">
                    No groups yet. Create your first group!
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Pending Invites */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Invites</h3>
              <p className="mt-1 text-sm text-gray-500">
                Groups you've been invited to join
              </p>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {pendingInvites.map((group) => (
                  <li key={group._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-500">
                          Invited by {group.createdBy?.name}
                        </p>
                        {group.description && (
                          <p className="text-xs text-gray-400 mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleInviteResponse(group._id, 'accept')}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleInviteResponse(group._id, 'reject')}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {pendingInvites.length === 0 && (
                  <li className="px-4 py-4 text-center text-gray-500">
                    No pending invites
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
