import React, { useState, useEffect } from 'react';
  import { useParams } from 'react-router-dom';
  import api from '../utils/api';

  const ReportsPage = ({ user }) => {
    const { groupId } = useParams();
    const [report, setReport] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [newExpense, setNewExpense] = useState({
      description: '',
      amount: '',
      splitType: 'equal'
    });
    const [customPercentages, setCustomPercentages] = useState({});
    const [newMemberEmails, setNewMemberEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addExpenseLoading, setAddExpenseLoading] = useState(false);
    const [addMemberLoading, setAddMemberLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
      fetchReportData();
    }, [groupId]);

    const fetchReportData = async () => {
      try {
        setError('');
        setLoading(true);
        
        console.log('Fetching report data for group:', groupId);
        
        // Fetch all data including group members
        const [reportResponse, expensesResponse, membersResponse] = await Promise.all([
          api.get(`/expenses/report/${groupId}`),
          api.get(`/expenses/group/${groupId}`),
          api.get(`/groups/${groupId}/members`).catch(error => {
            console.warn('Group members API failed, using report members:', error);
            return { data: { members: [] } };
          })
        ]);

        console.log('API responses:', {
          report: reportResponse.data,
          expenses: expensesResponse.data,
          members: membersResponse.data.members
        });
        
        setReport(reportResponse.data);
        
        // Filter out invalid splits where user owes to themselves
        const filteredExpenses = (expensesResponse.data || []).map(expense => ({
          ...expense,
          splits: expense.splits?.filter(split => 
            split.user && 
            expense.paidBy && 
            !compareIds(split.user._id, expense.paidBy._id)
          ) || []
        }));
        
        setExpenses(filteredExpenses);
        
        // Priority: direct members API > report members
        let members = membersResponse.data.members || reportResponse.data.members || [];
        
        console.log('Final members data:', members);
        
      } catch (error) {
        console.error('Unexpected error in fetchReportData:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to load report data. Please check your connection and try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Download Report Function
    const downloadReport = async () => {
      try {
        setDownloading(true);
        setError('');

        // Generate report content
        const reportContent = generateReportContent();

        // Create blob and download
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `expense-report-group-${groupId}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccess('Report downloaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error downloading report:', error);
        setError('Failed to download report. Please try again.');
      } finally {
        setDownloading(false);
      }
    };

    // Generate comprehensive report content
    const generateReportContent = () => {
      const members = getMembers();
      const groupName = report?.groupName || `Group ${groupId}`;
      const currentDate = new Date().toLocaleDateString();
      
      let content = `EXPENSE REPORT\n`;
      content += `===============\n\n`;
      content += `Group: ${groupName}\n`;
      content += `Report Date: ${currentDate}\n`;
      content += `Total Members: ${members.length}\n`;
      content += `Total Expenses: ${expenses.length}\n\n`;

      // Group Members Section
      content += `GROUP MEMBERS:\n`;
      content += `--------------\n`;
      members.forEach((member, index) => {
        const isYou = compareIds(member._id, user.id) ? ' (You)' : '';
        content += `${index + 1}. ${member.name}${isYou} - ${member.email}\n`;
      });
      content += `\n`;

      // Settlement Summary Section
      content += `SETTLEMENT SUMMARY:\n`;
      content += `------------------\n`;
      if (report && report.settlements && report.settlements.length > 0) {
        report.settlements.forEach((settlement, index) => {
          const fromName = settlement.from?.name || 'Unknown User';
          const toName = settlement.to?.name || 'Unknown User';
          const amount = settlement.amount?.toFixed(2) || '0.00';
          content += `${index + 1}. ${fromName} → ${toName}: ₹${amount}\n`;
        });
      } else {
        content += `All expenses are settled! 🎉\n`;
      }
      content += `\n`;

      // Detailed Expenses Section
      content += `DETAILED EXPENSES:\n`;
      content += `------------------\n`;
      if (expenses.length > 0) {
        expenses.forEach((expense, expenseIndex) => {
          const paidByName = expense.paidBy?.name || 'Unknown User';
          const validSplits = getValidSplits(expense);
          
          content += `\nExpense ${expenseIndex + 1}:\n`;
          content += `  Description: ${expense.description}\n`;
          content += `  Amount: ₹${expense.amount}\n`;
          content += `  Paid By: ${paidByName}${compareIds(expense.paidBy?._id, user.id) ? ' (You)' : ''}\n`;
          content += `  Split Type: ${expense.splitType}\n`;
          content += `  Date: ${new Date(expense.createdAt).toLocaleDateString()}\n`;
          
          if (validSplits.length > 0) {
            content += `  Splits:\n`;
            validSplits.forEach((split, splitIndex) => {
              const userName = split.user?.name || 'Unknown User';
              const status = split.paid ? '✅ Paid' : '❌ Not Paid';
              const percentageInfo = expense.splitType === 'custom' && split.percentage ? ` (${split.percentage}%)` : '';
              content += `    ${splitIndex + 1}. ${userName}${compareIds(split.user?._id, user.id) ? ' (You)' : ''}: ₹${split.amount?.toFixed(2) || '0.00'}${percentageInfo} - ${status}\n`;
            });
          } else {
            content += `  Splits: No splits (payer only expense)\n`;
          }
        });
      } else {
        content += `No expenses recorded.\n`;
      }

      // Financial Summary Section
      content += `\nFINANCIAL SUMMARY:\n`;
      content += `-----------------\n`;
      const totalAmount = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      content += `Total Amount Spent: ₹${totalAmount.toFixed(2)}\n`;
      
      // Calculate per member totals
      if (members.length > 0) {
        content += `Average per Member: ₹${(totalAmount / members.length).toFixed(2)}\n`;
      }

      // Footer
      content += `\n\n---\n`;
      content += `Generated by Expense Tracker App\n`;
      content += `Report ID: ${groupId}-${Date.now()}`;

      return content;
    };

    // Get members from report data
    const getMembers = () => {
      return (report && report.members) ? report.members : [];
    };

    // Check if current user is group creator - simplified version
    const isGroupCreator = () => {
      const members = getMembers();
      return members.some(member => compareIds(member._id, user.id));
    };

    const handleAddExpense = async (e) => {
      e.preventDefault();
      
      // Validation
      if (!newExpense.description.trim()) {
        setError('Please enter a description');
        return;
      }
      
      if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const members = getMembers();
      if (members.length === 0) {
        setError('No members found in this group. Please add members first.');
        return;
      }

      // For custom split, validate percentages
      if (newExpense.splitType === 'custom') {
        if (!validateCustomPercentages()) {
          setError('Custom percentages must total exactly 100%');
          return;
        }
      }

      setAddExpenseLoading(true);
      setError('');

      try {
        const expenseData = {
          description: newExpense.description.trim(),
          amount: parseFloat(newExpense.amount),
          groupId: groupId,
          splitType: newExpense.splitType,
          paidBy: user._id || user.id
        };

        // Add custom splits if applicable
        if (newExpense.splitType === 'custom') {
          const calculatedSplits = Object.entries(customPercentages)
            .filter(([userId, percentage]) => percentage && parseFloat(percentage) > 0)
            .map(([userId, percentage]) => {
              const amount = (parseFloat(newExpense.amount) * parseFloat(percentage)) / 100;
              return {
                user: userId,
                percentage: parseFloat(percentage),
                amount: amount
              };
            });
          
          expenseData.splits = calculatedSplits;
        }

        console.log('Sending expense data:', expenseData);
        const response = await api.post('/expenses', expenseData);
        
        // Reset form and close modal
        setNewExpense({ description: '', amount: '', splitType: 'equal' });
        setCustomPercentages({});
        setShowAddExpense(false);
        
        // Refresh data
        await fetchReportData();
        
        setSuccess('Expense added successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
      } catch (error) {
        console.error('Error adding expense:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to add expense. Please try again.';
        setError(errorMessage);
      } finally {
        setAddExpenseLoading(false);
      }
    };

    const handleSplitTypeChange = (splitType) => {
      setNewExpense({ ...newExpense, splitType });
      
      // Auto-set equal percentages when switching to custom split
      if (splitType === 'custom') {
        const members = getMembers();
        if (members && members.length > 0) {
          const equalPercentage = (100 / members.length).toFixed(2);
          const newPercentages = {};
          
          members.forEach(member => {
            newPercentages[member._id] = equalPercentage;
          });
          
          setCustomPercentages(newPercentages);
        }
      }
    };

    const handleCustomPercentageChange = (userId, value) => {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        const numValue = parseFloat(value);
        if (value === '' || (numValue >= 0 && numValue <= 100)) {
          setCustomPercentages(prev => ({
            ...prev,
            [userId]: value
          }));
        }
      }
    };

    const handleEqualSplit = () => {
      const members = getMembers();
      if (!members || members.length === 0) return;
      
      const equalPercentage = (100 / members.length).toFixed(2);
      const newPercentages = {};
      
      members.forEach(member => {
        newPercentages[member._id] = equalPercentage;
      });
      
      setCustomPercentages(newPercentages);
    };

    const handleClearPercentages = () => {
      setCustomPercentages({});
    };

    const validateCustomPercentages = () => {
      const members = getMembers();
      if (!members || members.length === 0) return false;
      
      const percentages = Object.values(customPercentages);
      if (percentages.length === 0) return false;
      
      const validPercentages = percentages.every(percentage => {
        const num = parseFloat(percentage);
        return !isNaN(num) && num >= 0 && num <= 100;
      });
      
      if (!validPercentages) return false;
      
      const totalPercentage = percentages.reduce((sum, percentage) => {
        return sum + (parseFloat(percentage) || 0);
      }, 0);
      
      return Math.abs(totalPercentage - 100) < 0.1;
    };

    const getTotalPercentage = () => {
      return Object.values(customPercentages).reduce((sum, percentage) => {
        return sum + (parseFloat(percentage) || 0);
      }, 0);
    };

    const getRemainingPercentage = () => {
      return (100 - getTotalPercentage()).toFixed(2);
    };

    const calculateMemberAmount = (percentage) => {
      if (!percentage || !newExpense.amount) return 0;
      return (parseFloat(newExpense.amount) * parseFloat(percentage)) / 100;
    };

    // Safe comparison function for IDs
    const compareIds = (id1, id2) => {
      if (!id1 || !id2) return false;
      return id1.toString() === id2.toString();
    };

    // Check if current user is the one who needs to pay in a settlement
    const isCurrentUserDebtor = (settlement) => {
      return compareIds(settlement.from?._id, user.id);
    };

    // Check if current user is the one who needs to pay in an expense split
    const shouldShowMarkPaid = (expense, split) => {
      return (
        !split.paid && 
        split.user && 
        compareIds(split.user._id, user.id) &&
        expense.paidBy && 
        !compareIds(expense.paidBy._id, user.id) &&
        !compareIds(expense.paidBy._id, split.user._id)
      );
    };

    // Filter out invalid splits where user owes to themselves
    const getValidSplits = (expense) => {
      return expense.splits?.filter(split => 
        split.user && 
        expense.paidBy && 
        !compareIds(split.user._id, expense.paidBy._id)
      ) || [];
    };

    const handleSearchUsers = async (query) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      }
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

    const handleAddMembers = async (e) => {
      e.preventDefault();
      if (newMemberEmails.length === 0) return;
      
      setAddMemberLoading(true);
      setError('');
      
      try {
        await api.post(`/groups/${groupId}/members`, {
          emails: newMemberEmails
        });
        
        setSuccess('Members added successfully!');
        resetMemberForm();
        await fetchReportData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error adding members:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to add members. Please try again.';
        setError(errorMessage);
      } finally {
        setAddMemberLoading(false);
      }
    };

    const handleSettlePayment = async (fromUserId, toUserId, amount) => {
      try {
        await api.post('/expenses/settle', {
          groupId,
          fromUserId,
          toUserId,
          amount
        });
        
        setSuccess('Payment settled successfully!');
        await fetchReportData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error settling payment:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to settle payment. Please try again.';
        setError(errorMessage);
      }
    };

    const handleMarkAsPaid = async (expenseId, userId) => {
      try {
        await api.post(`/expenses/${expenseId}/mark-paid`, {
          userId
        });
        
        setSuccess('Marked as paid successfully!');
        await fetchReportData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error marking as paid:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Failed to mark as paid. Please try again.';
        setError(errorMessage);
      }
    };

    const resetExpenseForm = () => {
      setNewExpense({ description: '', amount: '', splitType: 'equal' });
      setCustomPercentages({});
      setShowAddExpense(false);
    };

    const resetMemberForm = () => {
      setShowAddMemberModal(false);
      setNewMemberEmails([]);
      setSearchQuery('');
      setSearchResults([]);
    };

    if (loading) {
      return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">Loading report...</div>
          </div>
        </div>
      );
    }

    const members = getMembers();

    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-100 border-green-400 text-green-700 px-4 py-3 rounded border">
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded border">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expense Report</h1>
              {members && (
                <p className="text-sm text-gray-500 mt-1">
                  {members.length} members in this group
                  {isGroupCreator() && ' • You are the group creator'}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {isGroupCreator() && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Members
                </button>
              )}
              <button
                onClick={() => {
                  if (members.length === 0) {
                    setError('No members found in this group. Please add members first.');
                  } else {
                    setShowAddExpense(true);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Expense
              </button>
            </div>
          </div>

          {/* Settlement Summary */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Settlement Summary</h3>
              <p className="mt-1 text-sm text-gray-500">
                Shows who needs to pay whom. Click "Settle" to mark payments as completed.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {report && report.settlements && report.settlements.length > 0 ? (
                <div className="space-y-3">
                  {report.settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {settlement.from?.name || 'Unknown User'}
                          {settlement.from && compareIds(settlement.from._id, user.id) && (
                            <span className="ml-1 text-orange-600 font-medium">(You)</span>
                          )}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-sm font-medium text-gray-900">
                          {settlement.to?.name || 'Unknown User'}
                          {settlement.to && compareIds(settlement.to._id, user.id) && (
                            <span className="ml-1 text-blue-600 font-medium">(You)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-green-600">
                          ₹{settlement.amount?.toFixed(2) || '0.00'}
                        </span>
                        {isCurrentUserDebtor(settlement) && (
                          <button
                            onClick={() => handleSettlePayment(
                              settlement.from?._id, 
                              settlement.to?._id, 
                              settlement.amount
                            )}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">All expenses are settled! 🎉</p>
              )}
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">All Expenses</h3>
              <p className="mt-1 text-sm text-gray-500">
                "Mark Paid" option is only shown to users who owe money for that expense.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {expenses.map((expense) => {
                  const validSplits = getValidSplits(expense);
                  return (
                    <li key={expense._id} className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{expense.description}</h4>
                          <p className="text-sm text-gray-500">
                            Paid by {expense.paidBy?.name || 'Unknown User'} • ₹{expense.amount} • {expense.splitType} split
                            {expense.paidBy && compareIds(expense.paidBy._id, user.id) && (
                              <span className="ml-2 text-blue-600 font-medium">(You paid)</span>
                            )}
                          </p>
                          <div className="mt-2 space-y-1">
                            {validSplits.map((split, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className={split.paid ? 'text-green-600' : 'text-gray-600'}>
                                  {split.user?.name || 'Unknown User'} owes ₹{split.amount?.toFixed(2) || '0.00'}
                                  {expense.splitType === 'custom' && split.percentage && (
                                    <span className="ml-1 text-gray-400">({split.percentage}%)</span>
                                  )}
                                  {split.user && compareIds(split.user._id, user.id) && (
                                    <span className="ml-1 text-orange-600 font-medium">(You)</span>
                                  )}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={split.paid ? 'text-green-600' : 'text-red-600'}>
                                    {split.paid ? '✅ Paid' : '❌ Not Paid'}
                                  </span>
                                  {shouldShowMarkPaid(expense, split) && (
                                    <button
                                      onClick={() => handleMarkAsPaid(expense._id, split.user._id)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {validSplits.length === 0 && (
                              <div className="text-sm text-gray-500 italic">
                                No splits to display (payer only expense)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {expenses.length === 0 && (
                  <li className="px-4 py-8 text-center text-gray-500">
                    No expenses yet. Add your first expense!
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Download Report Button */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Export Report</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Download a comprehensive text report of all expenses, settlements, and group information.
                </p>
                <button
                  onClick={downloadReport}
                  disabled={downloading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Expense Report
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  The report will include all expenses, settlements, member details, and financial summaries.
                </p>
              </div>
            </div>
          </div>

          {/* Add Expense Modal */}
          {showAddExpense && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Add New Expense</h3>
                  
                  <form onSubmit={handleAddExpense}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Dinner, Hotel, Taxi"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            disabled={addExpenseLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (₹) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                            disabled={addExpenseLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Split Type
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newExpense.splitType}
                            onChange={(e) => handleSplitTypeChange(e.target.value)}
                            disabled={addExpenseLoading || members.length === 0}
                          >
                            <option value="equal">Equal Split</option>
                            <option value="custom" disabled={members.length === 0}>
                              Custom Split by Percentage {members.length === 0 && '(No members)'}
                            </option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {newExpense.splitType === 'equal' 
                              ? 'Amount will be split equally among all members' 
                              : 'Set custom percentages for each member'}
                          </p>
                          {members.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                              No members found. Please add members to the group first.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Custom Split Section */}
                      <div className={`${newExpense.splitType === 'custom' ? 'block' : 'hidden'}`}>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Split Percentages *
                              </label>
                              <p className="text-xs text-gray-500 mt-1">Set percentage for each member (Total: 100%)</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={handleEqualSplit}
                                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 border border-blue-300"
                              >
                                Equal Split
                              </button>
                              <button
                                type="button"
                                onClick={handleClearPercentages}
                                className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 border border-gray-300"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                          
                          {members && members.length > 0 ? (
                            <>
                              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {members.map((member) => (
                                  <div key={member._id} className="flex items-center justify-between bg-white p-3 rounded border">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {member.name}
                                        {compareIds(member._id, user.id) && (
                                          <span className="ml-1 text-blue-600 text-xs">(You)</span>
                                        )}
                                      </div>
                                      {customPercentages[member._id] && newExpense.amount && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          ₹{calculateMemberAmount(customPercentages[member._id]).toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 w-32">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          className="w-20 px-3 py-2 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="0.00"
                                          value={customPercentages[member._id] || ''}
                                          onChange={(e) => handleCustomPercentageChange(member._id, e.target.value)}
                                          disabled={addExpenseLoading}
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Percentage Summary */}
                              <div className="mt-4 p-3 bg-white rounded border">
                                <div className="flex justify-between items-center text-sm mb-2">
                                  <span className="text-gray-700 font-medium">Total Percentage:</span>
                                  <span className={
                                    Math.abs(getTotalPercentage() - 100) < 0.01 
                                      ? 'text-green-600 font-bold' 
                                      : 'text-red-600 font-bold'
                                  }>
                                    {getTotalPercentage().toFixed(2)}%
                                    {Math.abs(getTotalPercentage() - 100) < 0.01 ? ' ✓' : ' ✗'}
                                  </span>
                                </div>
                                {Math.abs(getTotalPercentage() - 100) >= 0.01 && (
                                  <div className="text-xs text-red-600 text-center bg-red-50 py-1 rounded">
                                    <strong>Remaining: {getRemainingPercentage()}%</strong> - Must total exactly 100%
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <p>No members found in this group.</p>
                              <p className="text-sm mt-1">Please add members first to use custom split.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Equal Split Info */}
                      {newExpense.splitType === 'equal' && members && members.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">
                                Equal Split
                              </h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>Total: ₹{newExpense.amount || '0.00'}</p>
                                <p>Split equally among {members.length} members</p>
                                <p className="font-semibold mt-1">
                                  Each member owes: ₹{newExpense.amount ? (parseFloat(newExpense.amount) / members.length).toFixed(2) : '0.00'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={resetExpenseForm}
                        disabled={addExpenseLoading}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addExpenseLoading || (newExpense.splitType === 'custom' && !validateCustomPercentages())}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {addExpenseLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          'Add Expense'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Add Members Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Members to Group</h3>
                  
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
                        disabled={addMemberLoading}
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
                                disabled={addMemberLoading}
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
                        onClick={resetMemberForm}
                        disabled={addMemberLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addMemberLoading || newMemberEmails.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {addMemberLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : (
                          'Add Members'
                        )}
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

  export default ReportsPage;