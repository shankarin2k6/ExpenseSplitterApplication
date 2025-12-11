const Expense = require('../models/Expense');
const Group = require('../models/Group');
const mongoose = require('mongoose');

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const { description, amount, groupId, splitType, splits } = req.body;

    console.log('=== ADD EXPENSE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);

    // Validate required fields
    if (!description || !description.trim()) {
      return res.status(400).json({
        message: 'Expense description is required'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Valid expense amount is required'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        message: 'Group ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: 'Invalid group ID format'
      });
    }

    // Verify group exists and user is member - FIXED: Include all members regardless of status for validation
    const group = await Group.findOne({
      _id: groupId,
      'members.user': req.user._id
    }).populate('members.user');

    if (!group) {
      return res.status(404).json({ 
        message: 'Group not found or you are not a member of this group' 
      });
    }

    // Calculate splits
    let expenseSplits;
    if (splitType === 'equal') {
      console.log('Calculating equal splits...');
      expenseSplits = await calculateEqualSplits(group, amount, req.user._id);
    } else if (splitType === 'custom') {
      console.log('Using custom splits...');
      expenseSplits = await calculateCustomSplits(group, amount, splits, req.user._id);
    } else {
      return res.status(400).json({
        message: 'Invalid split type'
      });
    }

    // Validate that splits are calculated
    if (!expenseSplits || expenseSplits.length === 0) {
      return res.status(400).json({
        message: 'Could not calculate expense splits'
      });
    }

    // Create expense object
    const expenseData = {
      description: description.trim(),
      amount: parseFloat(amount),
      paidBy: req.user._id,
      group: groupId,
      splitType,
      splits: expenseSplits
    };

    console.log('Creating expense with data:', JSON.stringify(expenseData, null, 2));

    const expense = new Expense(expenseData);
    await expense.save();

    // Add expense to group
    group.expenses.push(expense._id);
    await group.save();

    // Populate the response
    await expense.populate('paidBy', 'name email');
    await expense.populate('splits.user', 'name email');

    console.log('=== EXPENSE CREATED SUCCESSFULLY ===');

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });

  } catch (error) {
    console.error('!!! ERROR ADDING EXPENSE !!!');
    console.error('Error:', error.message);
    
    res.status(500).json({
      message: 'Error adding expense',
      error: error.message
    });
  }
};

// Calculate equal splits
const calculateEqualSplits = async (group, amount, paidById) => {
  try {
    console.log('=== CALCULATING EQUAL SPLITS ===');
    
    // FIXED: Only include accepted members for splits
    const acceptedMembers = group.members.filter(m => m.status === 'accepted');
    console.log('Active members for splits:', acceptedMembers.length);

    if (acceptedMembers.length === 0) {
      throw new Error('No active members in group for split calculation');
    }

    const splitAmount = parseFloat(amount) / acceptedMembers.length;
    console.log('Split amount per person:', splitAmount);

    const splits = acceptedMembers.map((member) => {
      // Don't create split for the payer owing to themselves
      if (member.user._id.toString() === paidById.toString()) {
        return null;
      }
      
      return {
        user: member.user._id,
        amount: parseFloat(splitAmount.toFixed(2)),
        percentage: parseFloat((100 / acceptedMembers.length).toFixed(2)),
        paid: false
      };
    }).filter(split => split !== null); // Remove null splits

    console.log('Final splits for equal split:', splits);
    console.log('=== SPLITS CALCULATION COMPLETE ===');
    return splits;

  } catch (error) {
    console.error('!!! ERROR IN CALCULATE EQUAL SPLITS !!!');
    throw error;
  }
};

// Calculate custom splits - FIXED VERSION
// Calculate custom splits - IMPROVED VERSION with better rounding
const calculateCustomSplits = async (group, amount, customSplits, paidById) => {
  try {
    console.log('=== CALCULATING CUSTOM SPLITS ===');
    console.log('Custom splits received:', JSON.stringify(customSplits, null, 2));
    console.log('Total amount:', amount);
    console.log('Paid by user ID:', paidById);
    
    // FIXED: Only include accepted members for splits
    const acceptedMembers = group.members.filter(m => m.status === 'accepted');
    console.log('Active members for custom splits:', acceptedMembers.length);

    if (acceptedMembers.length === 0) {
      throw new Error('No active members in group for split calculation');
    }

    // Validate custom splits
    if (!customSplits || !Array.isArray(customSplits) || customSplits.length === 0) {
      throw new Error('Custom splits data is required and must be an array');
    }

    // Create a map of member IDs for quick lookup
    const memberMap = new Map();
    acceptedMembers.forEach(member => {
      memberMap.set(member.user._id.toString(), member.user);
    });

    // Validate that all custom split users are group members
    const invalidUsers = customSplits.filter(split => {
      const userId = split.user?.toString ? split.user.toString() : split.user;
      return !memberMap.has(userId);
    });

    if (invalidUsers.length > 0) {
      throw new Error('Some users in custom splits are not group members');
    }

    // FIXED: Better rounding for percentages and amounts
    let totalPercentage = 0;
    let totalAmount = 0;
    
    // First pass: calculate totals with proper rounding
    const processedSplits = customSplits.map(split => {
      const percentage = parseFloat(parseFloat(split.percentage).toFixed(4)); // More precision
      const calculatedAmount = parseFloat((parseFloat(amount) * percentage / 100).toFixed(2));
      
      totalPercentage += percentage;
      totalAmount += calculatedAmount;
      
      return {
        ...split,
        percentage: percentage,
        amount: calculatedAmount
      };
    });

    console.log('Total percentage after calculation:', totalPercentage.toFixed(4));
    console.log('Total amount after calculation:', totalAmount.toFixed(2));
    console.log('Expected amount:', amount);

    // FIXED: More lenient validation for floating-point totals
    if (Math.abs(totalPercentage - 100) > 0.1) { // Increased tolerance
      throw new Error(`Total percentage must be 100%, got ${totalPercentage.toFixed(2)}%`);
    }

    if (Math.abs(totalAmount - parseFloat(amount)) > 0.1) { // Increased tolerance
      throw new Error(`Total amount must equal expense amount, got ${totalAmount.toFixed(2)} but expected ${amount}`);
    }

    // FIXED: Create splits array with proper rounding and exclude payer
    const splits = processedSplits
      .map((split) => {
        const userId = split.user?.toString ? split.user.toString() : split.user;
        
        // Don't create split for the payer owing to themselves
        if (userId === paidById.toString()) {
          console.log(`Skipping split for payer (user: ${userId})`);
          return null;
        }
        
        // Final rounding to 2 decimal places for amounts
        const splitAmount = parseFloat(parseFloat(split.amount).toFixed(2));
        const splitPercentage = parseFloat(parseFloat(split.percentage).toFixed(2));
        
        // Validate individual split
        if (isNaN(splitAmount) || splitAmount <= 0) {
          throw new Error(`Invalid amount for user ${userId}: ${split.amount}`);
        }
        
        if (isNaN(splitPercentage) || splitPercentage <= 0) {
          throw new Error(`Invalid percentage for user ${userId}: ${split.percentage}`);
        }

        return {
          user: split.user,
          amount: splitAmount,
          percentage: splitPercentage,
          paid: false
        };
      })
      .filter(split => split !== null); // Remove null splits

    console.log('Final custom splits calculated:', splits);
    console.log('=== CUSTOM SPLITS CALCULATION COMPLETE ===');
    return splits;

  } catch (error) {
    console.error('!!! ERROR IN CALCULATE CUSTOM SPLITS !!!');
    console.error('Error details:', error.message);
    throw error;
  }
};

// Get group expenses
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log('Fetching expenses for group:', groupId);

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email mobile')
      .populate('splits.user', 'name email mobile')
      .sort({ createdAt: -1 });

    console.log(`Found ${expenses.length} expenses for group ${groupId}`);
    res.json(expenses);

  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      message: 'Error fetching expenses',
      error: error.message
    });
  }
};

// Mark payment as paid
exports.markAsPaid = async (req, res) => {
  try {
    const { expenseId, userId } = req.body;
    console.log('Marking payment as paid:', { expenseId, userId });

    const expense = await Expense.findOne({
      _id: expenseId,
      'splits.user': userId
    });

    if (!expense) {
      console.log('Expense or split not found');
      return res.status(404).json({ message: 'Expense or split not found' });
    }

    const splitIndex = expense.splits.findIndex(s => s.user.equals(userId));
    
    if (splitIndex === -1) {
      return res.status(404).json({ message: 'Split not found for this user' });
    }

    expense.splits[splitIndex].paid = true;
    expense.splits[splitIndex].paidAt = new Date();

    // Check if all splits are paid
    const allPaid = expense.splits.every(split => split.paid);
    expense.settled = allPaid;
    if (allPaid) {
      expense.settledAt = new Date();
    }

    await expense.save();

    console.log('Payment marked as paid successfully');

    res.json({
      message: 'Payment marked as paid',
      expense
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

// Settle payment between users
exports.settlePayment = async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, groupId } = req.body;
    console.log('Settling payment:', { fromUserId, toUserId, amount, groupId });

    // Find all expenses where fromUserId owes toUserId in this group
    const expenses = await Expense.find({
      group: groupId,
      'splits.user': fromUserId,
      paidBy: toUserId,
      'splits.paid': false
    }).populate('splits.user');

    let settledAmount = 0;
    const settledExpenses = [];

    // Mark splits as paid until the settlement amount is reached
    for (const expense of expenses) {
      const splitIndex = expense.splits.findIndex(s => 
        s.user._id.equals(fromUserId) && !s.paid
      );

      if (splitIndex !== -1) {
        const splitAmount = expense.splits[splitIndex].amount;
        
        if (settledAmount + splitAmount <= amount) {
          // Mark this split as paid
          expense.splits[splitIndex].paid = true;
          expense.splits[splitIndex].paidAt = new Date();
          settledAmount += splitAmount;
          settledExpenses.push(expense._id);

          // Check if all splits are paid for this expense
          const allPaid = expense.splits.every(s => s.paid);
          expense.settled = allPaid;
          if (allPaid) {
            expense.settledAt = new Date();
          }

          await expense.save();
        } else {
          // Partial settlement - create a new split for remaining amount
          const remainingAmount = amount - settledAmount;
          if (remainingAmount > 0) {
            expense.splits[splitIndex].amount -= remainingAmount;
            // Create a new paid split for the settled portion
            expense.splits.push({
              user: fromUserId,
              amount: remainingAmount,
              percentage: (remainingAmount / expense.amount) * 100,
              paid: true,
              paidAt: new Date()
            });
            settledAmount = amount;
            await expense.save();
          }
          break;
        }
      }
    }

    console.log(`Settled ${settledAmount} from ${fromUserId} to ${toUserId}`);

    res.json({
      message: 'Payment settled successfully',
      settledAmount,
      settledExpenses
    });

  } catch (error) {
    console.error('Error settling payment:', error);
    res.status(500).json({
      message: 'Error settling payment',
      error: error.message
    });
  }
};

// Generate settlement report - FIXED VERSION
exports.getSettlementReport = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log('Generating settlement report for group:', groupId);

    // FIXED: Get group with all accepted members
    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    console.log(`Found ${expenses.length} expenses for settlement report`);

    // FIXED: Get all accepted members from the group
    const acceptedMembers = group.members.filter(m => m.status === 'accepted');
    console.log('Accepted members in group:', acceptedMembers.length);

    // Initialize balances with all accepted members
    const balances = {};
    const members = {};

    // Initialize all members with zero balance
    acceptedMembers.forEach(member => {
      const memberId = member.user._id.toString();
      balances[memberId] = 0;
      members[memberId] = member.user;
    });

    // Calculate net balances from expenses
    expenses.forEach(expense => {
      if (!expense.paidBy) return;
      
      const paidById = expense.paidBy._id.toString();
      
      // Ensure payer is in balances
      if (!balances[paidById]) {
        balances[paidById] = 0;
        members[paidById] = expense.paidBy;
      }
      
      expense.splits.forEach(split => {
        if (!split.user) return;
        
        const userId = split.user._id.toString();
        
        // Ensure split user is in balances
        if (!balances[userId]) {
          balances[userId] = 0;
          members[userId] = split.user;
        }
        
        // Payer gets positive, owee gets negative
        if (paidById !== userId) {
          balances[paidById] += split.amount;
          balances[userId] -= split.amount;
        }
      });
    });

    // Calculate who owes whom
    const settlements = [];
    const userIds = Object.keys(balances);

    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const userA = userIds[i];
        const userB = userIds[j];
        
        if (balances[userA] > 0 && balances[userB] < 0) {
          const amount = Math.min(balances[userA], -balances[userB]);
          if (amount > 0.01) { // Avoid very small amounts
            settlements.push({
              from: members[userB],
              to: members[userA],
              amount: parseFloat(amount.toFixed(2))
            });
            balances[userA] -= amount;
            balances[userB] += amount;
          }
        } else if (balances[userA] < 0 && balances[userB] > 0) {
          const amount = Math.min(-balances[userA], balances[userB]);
          if (amount > 0.01) {
            settlements.push({
              from: members[userA],
              to: members[userB],
              amount: parseFloat(amount.toFixed(2))
            });
            balances[userA] += amount;
            balances[userB] -= amount;
          }
        }
      }
    }

    console.log('Settlement report generated with', settlements.length, 'settlements');
    console.log('Members included in report:', Object.keys(members).length);

    res.json({
      expenses,
      balances,
      settlements,
      members: acceptedMembers.map(m => m.user), // FIXED: Return all accepted members
      createdBy: group.createdBy
    });

  } catch (error) {
    console.error('Error generating settlement report:', error);
    res.status(500).json({
      message: 'Error generating settlement report',
      error: error.message
    });
  }
};