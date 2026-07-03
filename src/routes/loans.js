const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET /loans
router.get('/', async (req, res) => {
  try {
    const { rows: loans } = await pool.query(
      'SELECT * FROM loans ORDER BY loan_date DESC, created_at DESC'
    );
    const { rows } = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM loans'
    );
    res.json({ loans, total: parseFloat(rows[0].total) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /loans
router.post('/', async (req, res) => {
  const { borrower, amount, loan_date } = req.body;

  if (!borrower || !amount || !loan_date) {
    return res.status(400).json({
      error: 'borrower, amount y loan_date son requeridos'
    });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO loans (borrower, amount, loan_date) VALUES ($1, $2, $3) RETURNING *',
      [borrower, amount, loan_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /loans/:id
router.put('/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM loans WHERE id = $1', [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const loan = existing[0];
    const { borrower, amount, loan_date, change_note } = req.body;

    // Guardar historial antes de cambiar
    await pool.query(
      `INSERT INTO history (loan_id, borrower_before, amount_before, loan_date_before, change_note)
       VALUES ($1, $2, $3, $4, $5)`,
      [loan.id, loan.borrower, loan.amount, loan.loan_date, change_note || null]
    );

    // Aplicar cambios
    await pool.query(
      `UPDATE loans
       SET borrower  = COALESCE($1, borrower),
           amount    = COALESCE($2, amount),
           loan_date = COALESCE($3, loan_date)
       WHERE id = $4`,
      [borrower || null, amount || null, loan_date || null, req.params.id]
    );

    const { rows: updated } = await pool.query(
      'SELECT * FROM loans WHERE id = $1', [req.params.id]
    );
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /loans/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM loans WHERE id = $1', [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    const loan = existing[0];

    await pool.query(
      `INSERT INTO history (loan_id, borrower_before, amount_before, loan_date_before, change_note)
       VALUES ($1, $2, $3, $4, 'Registro eliminado')`,
      [loan.id, loan.borrower, loan.amount, loan.loan_date]
    );

    await pool.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;