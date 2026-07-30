const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const admin = require('firebase-admin');

dotenv.config();

// Firebase Admin Initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            project_id: process.env.FIREBASE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

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
    category: String,
    profession: String,
    panNumber: String,
    aadhaarNumber: String,
    verificationDate: String,
    walletBalance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    userUid: { type: String, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    title: { type: String, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: String,
    image: String
});
const Category = mongoose.model('Category', categorySchema);

// Provider Schema (Extended from User)
const providerSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: String,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    distance: String,
    startingPrice: Number,
    category: String,
    bio: String,
    gallery: [String],
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true }
});
const Provider = mongoose.model('Provider', providerSchema);

// Service Schema
const serviceSchema = new mongoose.Schema({
    providerUid: String,
    name: String,
    price: Number,
    description: String
});
const Service = mongoose.model('Service', serviceSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    customerUid: String,
    providerUid: String,
    serviceName: String,
    status: { type: String, enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'done', 'cancelled'], default: 'pending' },
    address: String,
    scheduledTime: Date,
    totalAmount: Number,
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
    bookingId: String,
    providerUid: String,
    customerUid: String,
    customerName: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

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
    const { phoneNumber, uid } = req.query;
    try {
        let user;
        if (uid) {
            user = await User.findOne({ uid });
        } else if (phoneNumber) {
            user = await User.findOne({ phoneNumber });
        }

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
            category: req.body.category,
            isVerified: role === 'customer' // Customers verified by default
        });

        await newUser.save();

        // If user is a provider, create Provider entry
        if (role === 'provider') {
            const newProvider = new Provider({
                uid,
                name,
                category: req.body.category || 'Other',
                startingPrice: req.body.startingPrice || 0,
                bio: req.body.bio || '',
                isVerified: false // Explicitly false for new providers
            });
            await newProvider.save();
        }

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Wallet & Transactions
app.get('/api/wallet/transactions/:uid', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userUid: req.params.uid }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get analytics
app.get('/api/admin/analytics', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalProviders = await User.countDocuments({ role: 'provider', isVerified: true });
        const totalBookings = await Booking.countDocuments();

        // Calculate total revenue from completed bookings
        const revenueResult = await Booking.aggregate([
            { $match: { status: 'done' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Get category distribution
        const categoryStats = await Provider.aggregate([
            { $match: { isVerified: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const totalVerifiedProviders = totalProviders || 1; // Avoid division by zero
        const categories = categoryStats.map(stat => ({
            name: stat._id,
            ratio: stat.count / totalVerifiedProviders
        }));

        res.json({
            totalUsers,
            totalProviders,
            totalBookings,
            totalRevenue,
            categories
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all pending providers
app.get('/api/admin/pending-providers', async (req, res) => {
    try {
        const pendingUsers = await User.find({ role: 'provider', isVerified: false });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Approve provider
app.post('/api/admin/approve-provider', async (req, res) => {
    const { uid } = req.body;
    try {
        await User.findOneAndUpdate({ uid }, { isVerified: true });
        await Provider.findOneAndUpdate({ uid }, { isVerified: true });
        res.json({ message: 'Provider approved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update provider list for customers to only see verified ones
app.get('/api/providers', async (req, res) => {
    const { category } = req.query;
    try {
        const query = { isVerified: true };
        if (category) query.category = category;
        const providers = await Provider.find(query);
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Provider Details
app.get('/api/providers/:uid', async (req, res) => {
    try {
        const provider = await Provider.findOne({ uid: req.params.uid });
        const services = await Service.find({ providerUid: req.params.uid });
        const reviews = await Review.find({ providerUid: req.params.uid });
        res.json({ provider, services, reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/providers/:uid/availability', async (req, res) => {
    try {
        const { isAvailable } = req.body;
        await Provider.findOneAndUpdate({ uid: req.params.uid }, { isAvailable });
        res.json({ message: 'Availability updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/providers/:uid/services/:serviceId', async (req, res) => {
    try {
        const { price } = req.body;
        await Service.findByIdAndUpdate(req.params.serviceId, { price });
        res.json({ message: 'Service price updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bookings
app.post('/api/bookings', async (req, res) => {
    try {
        const newBooking = new Booking(req.body);
        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/customer/:uid', async (req, res) => {
    try {
        const bookings = await Booking.find({ customerUid: req.params.uid }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/provider/:uid', async (req, res) => {
    try {
        const bookings = await Booking.find({ providerUid: req.params.uid }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reviews
app.post('/api/reviews', async (req, res) => {
    try {
        const newReview = new Review(req.body);
        await newReview.save();

        // Update provider rating
        const reviews = await Review.find({ providerUid: req.body.providerUid });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
        await Provider.findOneAndUpdate(
            { uid: req.body.providerUid },
            { rating: avgRating, reviewCount: reviews.length }
        );

        res.status(201).json(newReview);
    } catch (error) {
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
