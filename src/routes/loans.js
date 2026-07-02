const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /loans — todos los préstamos + total general
router.get('/', (req, res) => {
  const loans = db.prepare(
    'SELECT * FROM loans ORDER BY created_at DESC'
  ).all();

  const totalRow = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM loans'
  ).get();

  res.json({ loans, total: totalRow.total });
});

// POST /loans — crear préstamo nuevo
router.post('/', (req, res) => {
  const { borrower, amount, loan_date } = req.body;

  if (!borrower || !amount || !loan_date) {
    return res.status(400).json({
      error: 'borrower, amount y loan_date son requeridos'
    });
  }

  const result = db.prepare(
    'INSERT INTO loans (borrower, amount, loan_date) VALUES (?, ?, ?)'
  ).run(borrower, amount, loan_date);

  const loan = db.prepare(
    'SELECT * FROM loans WHERE id = ?'
  ).get(result.lastInsertRowid);

  res.status(201).json(loan);
});

// PUT /loans/:id — editar préstamo (guarda historial ANTES de cambiar)
router.put('/:id', (req, res) => {
  const loan = db.prepare(
    'SELECT * FROM loans WHERE id = ?'
  ).get(req.params.id);

  if (!loan) {
    return res.status(404).json({ error: 'Préstamo no encontrado' });
  }

  const { borrower, amount, loan_date, change_note } = req.body;

  // PASO A: guardar el estado actual (antes del cambio) en history
  db.prepare(`
    INSERT INTO history
      (loan_id, borrower_before, amount_before, loan_date_before, change_note)
    VALUES (?, ?, ?, ?, ?)
  `).run(loan.id, loan.borrower, loan.amount, loan.loan_date, change_note || null);

  // PASO B: ahora sí, aplicar los cambios nuevos
  db.prepare(`
    UPDATE loans
    SET borrower  = COALESCE(?, borrower),
        amount    = COALESCE(?, amount),
        loan_date = COALESCE(?, loan_date)
    WHERE id = ?
  `).run(
    borrower  ?? null,
    amount    ?? null,
    loan_date ?? null,
    req.params.id
  );

  const updated = db.prepare(
    'SELECT * FROM loans WHERE id = ?'
  ).get(req.params.id);

  res.json(updated);
});

// DELETE /loans/:id — eliminar (también guarda historial antes)
router.delete('/:id', (req, res) => {
  const loan = db.prepare(
    'SELECT * FROM loans WHERE id = ?'
  ).get(req.params.id);

  if (!loan) {
    return res.status(404).json({ error: 'Préstamo no encontrado' });
  }

  db.prepare(`
    INSERT INTO history
      (loan_id, borrower_before, amount_before, loan_date_before, change_note)
    VALUES (?, ?, ?, ?, 'Registro eliminado')
  `).run(loan.id, loan.borrower, loan.amount, loan.loan_date);

  db.prepare('DELETE FROM loans WHERE id = ?').run(req.params.id);

  res.json({ message: 'Eliminado correctamente' });
});

module.exports = router;