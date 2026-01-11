require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from Vercel Server!');
});

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    if (mongoose.connection.readyState === 0) {
        await connectDB();
    }
    next();
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error('MONGO_URI is undefined in .env file!');
        }
        console.log(`Attempting to connect to MongoDB...`);
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// User Model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number,
});

const User = mongoose.model('User', userSchema);

// Result Card Model
const resultCardSchema = new mongoose.Schema({
    universityName: String,
    departmentName: String,
    semester: String,
    totalSubjects: Number,
    subjects: [{
        name: String,
        creditHours: Number,
        gpa: Number
    }],
    cgpa: Number,
    createdAt: { type: Date, default: Date.now }
});

const ResultCard = mongoose.model('ResultCard', resultCardSchema);

// Routes

// Create Result Card
app.post('/results', async (req, res) => {
    try {
        const newResult = new ResultCard(req.body);
        await newResult.save();
        res.status(201).json(newResult);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Result Cards
app.get('/results', async (req, res) => {
    try {
        const results = await ResultCard.find().sort({ createdAt: -1 });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create User
app.post('/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get All Users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update User
app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete User
app.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start Server
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

module.exports = app;
