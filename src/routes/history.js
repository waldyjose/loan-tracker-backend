const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET /history
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT h.*, l.borrower AS current_borrower
      FROM history h
      LEFT JOIN loans l ON l.id = h.loan_id
      ORDER BY h.changed_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history/:loanId
router.get('/:loanId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM history WHERE loan_id = $1 ORDER BY changed_at DESC',
      [req.params.loanId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;