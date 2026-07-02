const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /history — todo el historial de cambios de todos los préstamos
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT h.*, l.borrower AS current_borrower
    FROM history h
    LEFT JOIN loans l ON l.id = h.loan_id
    ORDER BY h.changed_at DESC
  `).all();

  res.json(rows);
});

// GET /history/:loanId — historial de un préstamo específico
router.get('/:loanId', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM history
    WHERE loan_id = ?
    ORDER BY changed_at DESC
  `).all(req.params.loanId);

  res.json(rows);
});

module.exports = router;