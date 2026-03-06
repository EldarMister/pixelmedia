// ─── Services Routes ──────────────────────────────────
const express = require('express');
const servicesRouter = express.Router();
const equipmentRouter = express.Router();
const db = require('./db');

// SERVICES ──────────────────────────────────────────────
servicesRouter.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM services';
    const params = [];
    if (category) {
      params.push(category);
      query += ' WHERE category = $1';
    }
    query += ' ORDER BY category, name';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

servicesRouter.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

servicesRouter.post('/', async (req, res) => {
  try {
    const { name, category, description, price, duration, notes } = req.body;
    const result = await db.query(
      'INSERT INTO services (name, category, description, price, duration, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, description, price || 0, duration, notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

servicesRouter.put('/:id', async (req, res) => {
  try {
    const { name, category, description, price, duration, notes } = req.body;
    const result = await db.query(
      'UPDATE services SET name=$1, category=$2, description=$3, price=$4, duration=$5, notes=$6 WHERE id=$7 RETURNING *',
      [name, category, description, price || 0, duration, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

servicesRouter.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// EQUIPMENT ─────────────────────────────────────────────
equipmentRouter.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipment ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

equipmentRouter.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

equipmentRouter.post('/', async (req, res) => {
  try {
    const { name, category, description, photo_url, status } = req.body;
    const result = await db.query(
      'INSERT INTO equipment (name, category, description, photo_url, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category, description, photo_url || null, status || 'free']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

equipmentRouter.put('/:id', async (req, res) => {
  try {
    const { name, category, description, photo_url, status } = req.body;
    const result = await db.query(
      'UPDATE equipment SET name=$1, category=$2, description=$3, photo_url=$4, status=$5 WHERE id=$6 RETURNING *',
      [name, category, description, photo_url || null, status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

equipmentRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE equipment SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

equipmentRouter.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM equipment WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = { servicesRouter, equipmentRouter };
