const express = require('express');
const {
  addExpense,
  getGroupExpenses,
  markAsPaid,
  getSettlementReport,
  settlePayment
} = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', addExpense);
router.get('/group/:groupId', getGroupExpenses);
router.post('/mark-paid', markAsPaid);
router.post('/settle-payment', settlePayment);
router.get('/report/:groupId', getSettlementReport);

module.exports = router;