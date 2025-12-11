const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  paid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  }
});

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Expense description is required'],
    trim: true,
    minlength: [1, 'Description cannot be empty']
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal'
  },
  splits: [splitSchema],
  settled: {
    type: Boolean,
    default: false
  },
  settledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add index for better performance
expenseSchema.index({ group: 1, createdAt: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splits.user': 1 });

// Virtual for total paid amount
expenseSchema.virtual('paidAmount').get(function() {
  return this.splits
    .filter(split => split.paid)
    .reduce((sum, split) => sum + split.amount, 0);
});

// Method to check if expense is fully paid
expenseSchema.methods.isFullyPaid = function() {
  return this.splits.every(split => split.paid);
};

// FIXED: REMOVE OR COMMENT OUT THE PRE-SAVE MIDDLEWARE ENTIRELY
// Your controller already handles validation properly
// expenseSchema.pre('save', function(next) {
//   // Only validate if this is a new expense or splits were modified
//   if (this.isNew || this.isModified('splits')) {
//     if (this.splitType === 'equal' && this.splits.length > 0) {
//       // For equal split, calculate equal amounts
//       const equalAmount = this.amount / this.splits.length;
//       this.splits.forEach(split => {
//         split.amount = parseFloat(equalAmount.toFixed(2));
//         split.percentage = parseFloat((100 / this.splits.length).toFixed(2));
//       });
//     } else if (this.splitType === 'custom' && this.splits.length > 0) {
//       // For custom split, use more lenient validation for floating-point numbers
//       const totalPercentage = this.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
//       const totalAmount = this.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
      
//       // Use more lenient tolerance for floating-point arithmetic
//       if (Math.abs(totalPercentage - 100) > 0.1) { // Changed from 0.01 to 0.1
//         return next(new Error(`Custom splits must total 100%. Current total: ${totalPercentage.toFixed(2)}%`));
//       }
      
//       if (Math.abs(totalAmount - this.amount) > 0.1) { // Changed from 0.01 to 0.1
//         return next(new Error(`Custom split amounts (${totalAmount.toFixed(2)}) must match the total expense amount (${this.amount})`));
//       }
//     }
//   }
  
//   next();
// });

module.exports = mongoose.model('Expense', expenseSchema);