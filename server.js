require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config'); // <-- Use the db from config.js

const app = express();
app.use(cors());
app.use(express.json());

// Get all customers
app.get('/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).send('Error fetching customers');
    res.json(results);
  });
});

// Get single customer
app.get('/customers/:id', (req, res) => {
  db.query('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).send('Error fetching customer');
    res.json(results[0]);
  });
});

// Create customer
app.post('/customers', (req, res) => {
  const { name, job, address, id_number, phone, doy, email, delivery_date, status } = req.body;
  db.query(
    'INSERT INTO customers (name, job, address, id_number, phone, doy, email, delivery_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, job, address, id_number, phone, doy, email, delivery_date, status || 'Pending'],
    (err, result) => {
      if (err) return res.status(500).send('Error inserting customer');
      res.status(201).send('Customer created');
    }
  );
});

// Update customer (remade for clarity and robustness)
app.put('/customers/:id', (req, res) => {
  const customerId = req.params.id;
  const {
    name = '',
    job = '',
    address = '',
    id_number = '',
    phone = '',
    doy = '',
    email = '',
    delivery_date = '',
    status = 'Pending'
  } = req.body;

  // Log the incoming data for debugging
  console.log('Updating customer:', customerId, req.body);

  // Validate required fields
  if (!name) return res.status(400).send('Name is required');

  db.query(
    `UPDATE customers SET
      name = ?,
      job = ?,
      address = ?,
      id_number = ?,
      phone = ?,
      doy = ?,
      email = ?,
      delivery_date = ?,
      status = ?
    WHERE id = ?`,
    [name, job, address, id_number, phone, doy, email, delivery_date, status, customerId],
    (err, result) => {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).send('Error updating customer');
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Customer not found');
      }
      res.send('Customer updated');
    }
  );
});

// Delete customer and their rooms
app.delete('/customers/:id', (req, res) => {
  const customerId = req.params.id;
  // First, delete all rooms for this customer
  db.query('DELETE FROM customer_room WHERE customer_id = ?', [customerId], (err) => {
    if (err) return res.status(500).send('Error deleting customer rooms');
    // Then, delete the customer
    db.query('DELETE FROM customers WHERE id = ?', [customerId], (err2) => {
      if (err2) return res.status(500).send('Error deleting customer');
      res.send('Customer and their rooms deleted');
    });
  });
});

// Get rooms for a customer
app.get('/rooms/:customerId', (req, res) => {
  db.query('SELECT * FROM customer_room WHERE customer_id = ?', [req.params.customerId], (err, results) => {
    if (err) return res.status(500).send('Error fetching rooms');
    res.json(results);
  });
});

// Add a new room
app.post('/rooms', (req, res) => {
  const { room_name, customer_id } = req.body;
  db.query(
    'INSERT INTO customer_room (room_name, customer_id) VALUES (?, ?)',
    [room_name, customer_id],
    (err, result) => {
      if (err) return res.status(500).send('Error adding room');
      res.status(201).send('Room added');
    }
  );
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // For demo: hardcoded credentials (move to DB for production)
  if (username === process.env.USER && password === process.env.PASSWORD) {
    res.json({ success: true, name: username });
  } else {
    res.status(401).json({ success: false, message: 'Λάθος όνομα χρήστη ή κωδικός.' });
  }
});

// Get statistics for completed, pending, and canceled customers for this month
app.get('/customer-stats', (req, res) => {
  db.query(
    `SELECT status, COUNT(*) as count
     FROM customers
     WHERE MONTH(delivery_date) = MONTH(CURRENT_DATE())
       AND YEAR(delivery_date) = YEAR(CURRENT_DATE())
     GROUP BY status`,
    (err, results) => {
      if (err) return res.status(500).send('Error fetching stats');
      res.json(results);
    }
  );
});

// Get pending customers
app.get('/customers-pending', (req, res) => {
  db.query(
    `SELECT * FROM customers WHERE status = 'Pending' ORDER BY delivery_date ASC`,
    (err, results) => {
      if (err) return res.status(500).send('Error fetching pending customers');
      res.json(results);
    }
  );
});

app.listen(8081, () => {
  console.log('Server running on port 8081');
});
