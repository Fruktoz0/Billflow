const express = require('express');
const { getMonthlyDashboard } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/:yearMonth
router.get('/:yearMonth', getMonthlyDashboard);

module.exports = router;
