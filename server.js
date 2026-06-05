require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const Lead = require('./models/Lead');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Direct Node to find public assets relative to current file path
const publicDir = path.resolve(__dirname, 'public');
app.use(express.static(publicDir));

app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretcrmkey',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mini-crm')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// Frontend View Deliveries
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));

// --- CRM API Endpoints ---

// 📥 Create Lead (From Website Contact Form)
app.post('/api/leads', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const newLead = new Lead({ name, email, message, status: 'new', notes: '' });
        await newLead.save();
        res.status(201).json({ message: 'Lead saved successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save lead info' });
    }
});

// 📤 Read All Leads (For Admin Dashboard)
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ date: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// 🔄 Update Lead Status or Notes
app.put('/api/leads/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const updatedLead = await Lead.findByIdAndUpdate(
            req.params.id,
            { status, notes },
            { new: true }
        );
        res.json({ success: true, updatedLead });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update lead records' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
