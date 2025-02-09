require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware to check if user is authenticated (optional)
const authenticateUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
};

// 📌 1. Get All Books
app.get('/books', async (req, res) => {
    const { data, error } = await supabase.from('books').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 📌 2. Add a New Book (Protected Route)
app.post('/books', authenticateUser, async (req, res) => {
    const { image_url, book_name, author_name, student_name, whatsapp_number } = req.body;

    const { data, error } = await supabase.from('books').insert([
        { image_url, book_name, author_name, student_name, whatsapp_number, is_available: true, user_id: req.user.id }
    ]);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Book added successfully", data });
});

// 📌 3. Delete a Book (Protected Route)
app.delete('/books/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('books').delete().match({ id, user_id: req.user.id });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Book deleted successfully" });
});

// 📌 4. Toggle Book Availability (Protected Route)
app.put('/books/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { is_available } = req.body;

    const { error } = await supabase.from('books').update({ is_available }).match({ id, user_id: req.user.id });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Availability updated" });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));