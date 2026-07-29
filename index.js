const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
    res.send('Madadwala Backend is running!');
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Cloudflare R2 Client
const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Multer setup for image uploads
const upload = multer({ storage: multer.memoryStorage() });

// User Schema
const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ['customer', 'provider', 'admin'], required: true },
    name: String,
    email: String,
    profileImage: String,
    aadhaarImage: String,
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware to verify Firebase ID Token
const verifyToken = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).send('Unauthorized');

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).send('Invalid token');
    }
};

// Check if user exists
app.get('/api/users/check', async (req, res) => {
    const { phoneNumber } = req.query;
    try {
        const user = await User.findOne({ phoneNumber });
        if (user) {
            res.json({ exists: true, user });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register User
app.post('/api/users/register', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'aadhaarImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const { uid, phoneNumber, role, name, email } = req.body;

        let profileImageUrl = '';
        let aadhaarImageUrl = '';

        // Upload to R2
        if (req.files['profileImage']) {
            const file = req.files['profileImage'][0];
            const fileName = `profiles/${uid}_${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            profileImageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        }

        if (req.files['aadhaarImage']) {
            const file = req.files['aadhaarImage'][0];
            const fileName = `aadhaar/${uid}_${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));
            aadhaarImageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        }

        const newUser = new User({
            uid,
            phoneNumber,
            role,
            name,
            email,
            profileImage: profileImageUrl,
            aadhaarImage: aadhaarImageUrl,
            isVerified: role === 'customer' // Customers verified by default, providers need admin check
        });

        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
