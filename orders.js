const express = require('express');
const router = express.Router();
const db = require('./db');

// GET all orders with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, date, month, year } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND order_date = $${params.length}`;
    }
    if (month && year) {
      params.push(parseInt(month));
      params.push(parseInt(year));
      query += ` AND EXTRACT(MONTH FROM order_date) = $${params.length - 1} AND EXTRACT(YEAR FROM order_date) = $${params.length}`;
    }

    query += ' ORDER BY order_date DESC, created_at DESC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'booked') as booked,
        COUNT(*) FILTER (WHERE status = 'deposit') as deposit,
        COALESCE(SUM(price), 0) as total_amount,
        COALESCE(SUM(deposit), 0) as total_deposit
      FROM orders
    `);

    const upcoming = await db.query(`
      SELECT * FROM orders
      WHERE order_date >= CURRENT_DATE
      AND status NOT IN ('completed')
      ORDER BY order_date ASC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        upcoming: upcoming.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET calendar dates (days with orders)
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const result = await db.query(`
      SELECT DISTINCT order_date, COUNT(*) as count
      FROM orders
      WHERE EXTRACT(MONTH FROM order_date) = $1
        AND EXTRACT(YEAR FROM order_date) = $2
      GROUP BY order_date
    `, [month || new Date().getMonth() + 1, year || new Date().getFullYear()]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET off days for calendar
router.get('/calendar/off-days', async (req, res) => {
  try {
    const { month, year } = req.query;
    const params = [];
    let query = 'SELECT id, off_date, note FROM off_days';

    if (month && year) {
      params.push(parseInt(month, 10));
      params.push(parseInt(year, 10));
      query += ' WHERE EXTRACT(MONTH FROM off_date) = $1 AND EXTRACT(YEAR FROM off_date) = $2';
    }

    query += ' ORDER BY off_date ASC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add off day
router.post('/calendar/off-days', async (req, res) => {
  try {
    const { off_date, note } = req.body;
    if (!off_date) {
      return res.status(400).json({ success: false, error: 'off_date is required' });
    }

    const result = await db.query(`
      INSERT INTO off_days (off_date, note)
      VALUES ($1, $2)
      ON CONFLICT (off_date)
      DO UPDATE SET note = EXCLUDED.note
      RETURNING *
    `, [off_date, note || null]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE one off day or all off days in month
router.delete('/calendar/off-days/:offDate', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM off_days WHERE off_date = $1::date RETURNING *',
      [req.params.offDate]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Off day not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/calendar/off-days', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'month and year are required' });
    }

    const result = await db.query(`
      DELETE FROM off_days
      WHERE EXTRACT(MONTH FROM off_date) = $1
        AND EXTRACT(YEAR FROM off_date) = $2
      RETURNING id
    `, [parseInt(month, 10), parseInt(year, 10)]);

    res.json({ success: true, deleted: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single order
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create order
router.post('/', async (req, res) => {
  try {
    const { client_name, phone, service_type, service_id, order_date, price, deposit, status, comment, photos } = req.body;
    const result = await db.query(`
      INSERT INTO orders (client_name, phone, service_type, service_id, order_date, price, deposit, status, comment, photos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [client_name, phone, service_type, service_id || null, order_date, price || 0, deposit || 0, status || 'booked', comment, JSON.stringify(photos || [])]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update order
router.put('/:id', async (req, res) => {
  try {
    const { client_name, phone, service_type, service_id, order_date, price, deposit, status, comment, photos } = req.body;
    const result = await db.query(`
      UPDATE orders SET
        client_name = $1, phone = $2, service_type = $3, service_id = $4,
        order_date = $5, price = $6, deposit = $7, status = $8,
        comment = $9, photos = $10
      WHERE id = $11
      RETURNING *
    `, [client_name, phone, service_type, service_id || null, order_date, price || 0, deposit || 0, status, comment, JSON.stringify(photos || []), req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
