const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');

dotenv.config();

// Razorpay Initialization
let razorpay;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log('Razorpay initialized successfully');
    } else {
        console.warn('Razorpay keys missing in environment variables. Payouts will not work.');
    }
} catch (error) {
    console.error('Failed to initialize Razorpay:', error.message);
}

// Firebase Admin Initialization
if (!admin.apps.length) {
    const project_id = process.env.FIREBASE_PROJECT_ID;
    const client_email = process.env.FIREBASE_CLIENT_EMAIL;
    const private_key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (project_id && client_email && private_key) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    project_id,
                    client_email,
                    private_key,
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Firebase Admin initialization error:', error.message);
        }
    } else {
        console.warn('Firebase environment variables missing. Firebase features (like Auth verification) will not work.');
    }
}

const app = express();
app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Middleware caught DB error:', err.message);
        res.status(500).json({
            error: "Database connection failed",
            details: err.message,
            hint: "Check MONGODB_URI and IP Whitelist"
        });
    }
});

// Root Route
app.get('/', (req, res) => {
    res.send('Madadwala Backend is running!');
});

// MongoDB Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Fail after 5s
            connectTimeoutMS: 10000,
        });
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('CRITICAL: MongoDB connection error:', err.message);
        throw err; // Rethrow to be caught by middleware
    }
};

// Cloudflare R2 Client
const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
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
    aadhaarNumber: String,
    verificationDate: String,
    selfieImage: String,
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String
    },
    walletBalance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalJobs: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    favorites: [{ type: String }], // Array of provider UIDs
    addresses: [{
        label: String, // 'Home', 'Work', etc.
        fullAddress: String,
        lat: Number,
        lng: Number
    }],
    dailyOnline: [{ type: String }], // Array of dates 'YYYY-MM-DD'
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Withdrawal Request Schema
const withdrawalSchema = new mongoose.Schema({
    providerUid: { type: String, required: true },
    providerName: String,
    amount: { type: Number, required: true },
    accountNumber: String,
    ifscCode: String,
    holderName: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'failed', 'paid'], default: 'pending' },
    rejectionReason: String,
    payoutId: String,
    errorMessage: String,
    createdAt: { type: Date, default: Date.now }
});
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

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
    isAvailable: { type: Boolean, default: true },
    dailyOnline: [{ type: String }], // Array of dates 'YYYY-MM-DD'
    lat: Number,
    lng: Number
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
    customerName: String,
    providerUid: String,
    providerName: String,
    serviceName: String,
    status: { type: String, enum: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'done', 'cancelled'], default: 'pending' },
    address: String,
    scheduledTime: String,
    totalAmount: Number,
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    otp: { type: String, required: true },
    customerLat: Number,
    customerLng: Number,
    providerLat: Number,
    providerLng: Number,
    partnerComment: String,
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

// Custom Request Schema
const customRequestSchema = new mongoose.Schema({
    customerUid: { type: String, required: true },
    customerName: { type: String, required: true },
    category: { type: String, required: true },
    problem: { type: String, required: true },
    minPrice: Number,
    maxPrice: Number,
    isAutoPrice: { type: Boolean, default: false },
    lat: Number,
    lng: Number,
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
    bids: [{
        providerUid: String,
        providerName: String,
        price: Number,
        createdAt: { type: Date, default: Date.now }
    }],
    rejectedBy: [{ type: String }], // Array of provider UIDs who rejected this request
    acceptedProviderUid: String,
    createdAt: { type: Date, default: Date.now }
});
const CustomRequest = mongoose.model('CustomRequest', customRequestSchema);

// Offer Schema
const offerSchema = new mongoose.Schema({
    title: String,
    description: String,
    code: String,
    discount: Number,
    expiryDate: Date,
    createdAt: { type: Date, default: Date.now }
});
const Offer = mongoose.model('Offer', offerSchema);

// Banner Schema
const bannerSchema = new mongoose.Schema({
    image: String,
    title: String,
    subtitle: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const Banner = mongoose.model('Banner', bannerSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
});
const Settings = mongoose.model('Settings', settingsSchema);

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
    console.log(`Starting registration for UID: ${req.body.uid}`);
    try {
        const { uid, phoneNumber, role, name, email, category, profession, aadhaarNumber } = req.body;

        let profileImageUrl = '';
        let aadhaarImageUrl = '';

        // Upload to R2
        if (req.files['profileImage']) {
            const file = req.files['profileImage'][0];
            const fileName = `profiles/${uid}_${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
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
                Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
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
            category: category,
            profession: profession,
            aadhaarNumber: aadhaarNumber,
            isVerified: role === 'customer' // Customers verified by default
        });

        await newUser.save();

        // If user is a provider, create Provider entry
        if (role === 'provider') {
            const newProvider = new Provider({
                uid,
                name,
                category: category || 'Other',
                startingPrice: 0,
                bio: '',
                isVerified: false // Explicitly false for new providers
            });
            await newProvider.save();

            // Initialize default services based on category
            const defaultServices = {
                'Electrical': [
                    { name: 'Fan Repair', price: 150 },
                    { name: 'Switchboard Installation', price: 200 },
                    { name: 'House Wiring', price: 1500 },
                    { name: 'AC Point Installation', price: 350 }
                ],
                'Plumbing': [
                    { name: 'Tap Fitting', price: 100 },
                    { name: 'Pipe Leakage Repair', price: 250 },
                    { name: 'Toilet Repair', price: 500 },
                    { name: 'Tank Cleaning', price: 1200 }
                ],
                'Cleaning': [
                    { name: 'Deep Home Cleaning', price: 2000 },
                    { name: 'Bathroom Cleaning', price: 300 },
                    { name: 'Kitchen Cleaning', price: 800 },
                    { name: 'Sofa Cleaning', price: 500 }
                ]
            };

            const servicesToCreate = defaultServices[category] || [
                { name: 'General Service', price: 100 },
                { name: 'Inspection', price: 50 }
            ];

            for (const s of servicesToCreate) {
                const newService = new Service({
                    providerUid: uid,
                    name: s.name,
                    price: s.price,
                    description: `${s.name} service`
                });
                await newService.save();
            }

            // Set starting price to the lowest service price
            const minPrice = Math.min(...servicesToCreate.map(s => s.price));
            await Provider.findOneAndUpdate({ uid }, { startingPrice: minPrice });
        }

        console.log(`Registration successful for UID: ${uid}`);
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Categories
// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/categories', async (req, res) => {
    try {
        const { name, icon } = req.body;
        const newCategory = new Category({ name, icon });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/active-jobs', async (req, res) => {
    try {
        const activeBookings = await Booking.find({
            status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress'] }
        }).sort({ createdAt: -1 });
        res.json(activeBookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Withdrawal Management
app.post('/api/withdrawals/request', async (req, res) => {
    try {
        const { providerUid, amount } = req.body;
        const user = await User.findOne({ uid: providerUid });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.bankDetails || !user.bankDetails.accountNumber) {
            return res.status(400).json({ error: 'Please add your bank account first' });
        }
        if (amount < 500) return res.status(400).json({ error: 'Minimum withdrawal amount is ₹500' });
        if (user.walletBalance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        const withdrawal = new Withdrawal({
            providerUid,
            providerName: user.name,
            amount,
            accountNumber: user.bankDetails.accountNumber,
            ifscCode: user.bankDetails.ifscCode,
            holderName: user.bankDetails.accountHolderName
        });
        await withdrawal.save();

        // Deduct from wallet immediately
        user.walletBalance -= amount;
        await user.save();

        // Log transaction
        const transaction = new Transaction({
            userUid: providerUid,
            type: 'debit',
            amount,
            title: 'Withdrawal Request',
            description: `Requested withdrawal of ₹${amount} to A/C ${user.bankDetails.accountNumber.slice(-4)}`
        });
        await transaction.save();

        res.json({ message: 'Withdrawal requested successfully. It takes 3-4 hours to credit.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/withdrawals/pending', async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/admin/withdrawals/:id', async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) return res.status(404).json({ error: 'Withdrawal request not found' });
        if (withdrawal.status !== 'pending' && withdrawal.status !== 'failed') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        if (status === 'rejected') {
            withdrawal.status = 'rejected';
            withdrawal.rejectionReason = rejectionReason || 'Rejected by admin';
            await withdrawal.save();

            // Refund the user
            const user = await User.findOne({ uid: withdrawal.providerUid });
            if (user) {
                user.walletBalance += withdrawal.amount;
                await user.save();

                const transaction = new Transaction({
                    userUid: withdrawal.providerUid,
                    type: 'credit',
                    amount: withdrawal.amount,
                    title: 'Withdrawal Refund',
                    description: `Refund for rejected withdrawal of ₹${withdrawal.amount}. Reason: ${withdrawal.rejectionReason}`
                });
                await transaction.save();
            }
            return res.json({ message: 'Withdrawal rejected and amount refunded' });
        }

        if (status === 'approved') {
            // Check if bank details are available
            if (!withdrawal.accountNumber || !withdrawal.ifscCode) {
                return res.status(400).json({ error: 'Partner bank details missing. Request remains pending.' });
            }

            try {
                // Razorpay Payout API Integration
                // Note: requires RAZORPAYX_ACCOUNT_NUMBER in .env
                if (process.env.RAZORPAYX_ACCOUNT_NUMBER && razorpay) {
                    const payout = await razorpay.payouts.create({
                        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
                        amount: withdrawal.amount * 100, // in paise
                        currency: 'INR',
                        mode: 'IMPS',
                        purpose: 'payout',
                        fund_account: {
                            account_type: 'bank_account',
                            bank_account: {
                                name: withdrawal.holderName,
                                ifsc: withdrawal.ifscCode,
                                account_number: withdrawal.accountNumber
                            },
                            contact: {
                                name: withdrawal.providerName,
                                type: 'vendor'
                            }
                        },
                        queue_if_low_balance: true,
                        reference_id: withdrawal._id.toString()
                    });

                    withdrawal.status = 'paid';
                    withdrawal.payoutId = payout.id;
                    await withdrawal.save();
                    return res.json({ message: 'Payout successful', payoutId: payout.id });
                } else {
                    // Fallback if RazorpayX is not configured but admin wants to mark as paid
                    withdrawal.status = 'paid';
                    withdrawal.payoutId = 'MANUAL_' + Date.now();
                    await withdrawal.save();
                    return res.json({ message: 'Withdrawal marked as paid (Manual/No RazorpayX)' });
                }
            } catch (payoutError) {
                console.error('Razorpay Payout Error:', payoutError);

                withdrawal.status = 'failed';
                withdrawal.errorMessage = payoutError.description || payoutError.message;
                await withdrawal.save();

                // Return amount to wallet on failure
                const user = await User.findOne({ uid: withdrawal.providerUid });
                if (user) {
                    user.walletBalance += withdrawal.amount;
                    await user.save();

                    const transaction = new Transaction({
                        userUid: withdrawal.providerUid,
                        type: 'credit',
                        amount: withdrawal.amount,
                        title: 'Payout Failed',
                        description: `Refund for failed payout: ${withdrawal.errorMessage}`
                    });
                    await transaction.save();
                }
                return res.status(500).json({ error: 'Payout failed: ' + withdrawal.errorMessage });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Withdrawal Management End

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
        const verificationDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        await User.findOneAndUpdate({ uid }, { isVerified: true, verificationDate });
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

        // Fetch profile image from User collection for each provider
        const providersWithImages = await Promise.all(providers.map(async (p) => {
            const user = await User.findOne({ uid: p.uid });
            return {
                ...p.toObject(),
                profileImage: user ? user.profileImage : null
            };
        }));

        res.json(providersWithImages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/providers/:uid/location', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        await Provider.findOneAndUpdate({ uid: req.params.uid }, { lat, lng });
        res.json({ message: 'Provider location updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Provider Details
app.get('/api/providers/:uid', async (req, res) => {
    try {
        const provider = await Provider.findOne({ uid: req.params.uid });
        const user = await User.findOne({ uid: req.params.uid });
        const services = await Service.find({ providerUid: req.params.uid });
        const reviews = await Review.find({ providerUid: req.params.uid });

        const providerWithImage = {
            ...provider.toObject(),
            profileImage: user ? user.profileImage : null
        };

        res.json({ provider: providerWithImage, services, reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/providers/:uid/availability', async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const today = new Date().toISOString().split('T')[0];

        let update = { isAvailable };
        if (isAvailable) {
            // Add today to dailyOnline if not already there
            await Provider.findOneAndUpdate(
                { uid: req.params.uid },
                { $addToSet: { dailyOnline: today } }
            );
        }

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

        // Recalculate starting price
        const allServices = await Service.find({ providerUid: req.params.uid });
        if (allServices.length > 0) {
            const minPrice = Math.min(...allServices.map(s => s.price));
            await Provider.findOneAndUpdate({ uid: req.params.uid }, { startingPrice: minPrice });
        }

        res.json({ message: 'Service price updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/providers/:uid/services', async (req, res) => {
    try {
        const { name, price } = req.body;
        const newService = new Service({
            providerUid: req.params.uid,
            name,
            price,
            description: `${name} service`
        });
        await newService.save();

        // Update starting price
        const provider = await Provider.findOne({ uid: req.params.uid });
        if (provider) {
            const currentMin = provider.startingPrice || Infinity;
            if (price < currentMin) {
                provider.startingPrice = price;
                await provider.save();
            }
        }

        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bookings
app.post('/api/bookings', async (req, res) => {
    console.log('Creating new booking:', JSON.stringify(req.body));
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const newBooking = new Booking({ ...req.body, otp });
        await newBooking.save();
        console.log(`Booking created successfully with ID: ${newBooking._id}`);
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/custom-requests/:id/direct-accept', async (req, res) => {
    try {
        const { providerUid, providerName } = req.body;
        const customReq = await CustomRequest.findById(req.params.id);
        if (!customReq) return res.status(404).json({ error: 'Request not found' });
        if (customReq.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

        customReq.status = 'accepted';
        customReq.acceptedProviderUid = providerUid;
        await customReq.save();

        // Use the price offered by the customer
        const price = customReq.minPrice || 0;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const newBooking = new Booking({
            customerUid: customReq.customerUid,
            customerName: customReq.customerName,
            providerUid: providerUid,
            providerName: providerName,
            serviceName: customReq.category + " (Custom)",
            status: 'accepted',
            address: customReq.customerName + "'s Location",
            scheduledTime: "ASAP",
            totalAmount: price,
            otp: otp,
            customerLat: customReq.lat,
            customerLng: customReq.lng
        });
        await newBooking.save();

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/customer/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        if (!uid || uid === 'null' || uid === 'undefined') {
            return res.status(400).json({ error: 'Valid User UID is required' });
        }
        const bookings = await Booking.find({ customerUid: uid }).sort({ createdAt: -1 });

        // Ensure provider names are present for accepted bookings
        const enrichedBookings = await Promise.all(bookings.map(async (b) => {
            if (!b.providerName && b.providerUid) {
                const provider = await User.findOne({ uid: b.providerUid });
                if (provider) {
                    b.providerName = provider.name;
                }
            }
            return b;
        }));

        res.json(enrichedBookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/provider/:uid', async (req, res) => {
    try {
        const bookings = await Booking.find({ providerUid: req.params.uid }).sort({ createdAt: -1 });

        // Ensure customer names are present
        const enrichedBookings = await Promise.all(bookings.map(async (b) => {
            if (!b.customerName && b.customerUid) {
                const customer = await User.findOne({ uid: b.customerUid });
                if (customer) {
                    b.customerName = customer.name;
                }
            }
            return b;
        }));

        res.json(enrichedBookings);
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

app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { status, scheduledTime, partnerComment } = req.body;
        const update = {};
        if (status) update.status = status;
        if (scheduledTime) update.scheduledTime = scheduledTime;
        if (partnerComment) update.partnerComment = partnerComment;

        await Booking.findByIdAndUpdate(req.params.id, update);
        res.json({ message: 'Booking updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bookings/:id/verify-otp', async (req, res) => {
    try {
        const { otp } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (booking.otp === otp) {
            booking.status = 'in_progress';
            await booking.save();
            res.json({ success: true, message: 'OTP verified, job started' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initiate Call via Exotel
app.post('/api/bookings/:id/call', async (req, res) => {
    try {
        const bookingId = req.params.id;
        console.log(`Initiating call for booking: ${bookingId}`);

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const customer = await User.findOne({ uid: booking.customerUid });
        const provider = await User.findOne({ uid: booking.providerUid });

        if (!customer || !provider) {
            return res.status(404).json({ error: 'Customer or Provider user data missing' });
        }

        const customerPhone = customer.phoneNumber;
        const providerPhone = provider.phoneNumber;

        // Ensure numbers are in a format Exotel likes (e.g. 0XXXXXXXXXX for India)
        const formatNumber = (num) => {
            let clean = num.replace(/\D/g, '');
            if (clean.length === 10) return '0' + clean;
            if (clean.length === 12 && clean.startsWith('91')) return '0' + clean.slice(2);
            return clean;
        };

        const formattedCustomer = formatNumber(customerPhone);
        const formattedProvider = formatNumber(providerPhone);

        console.log(`Exotel Call Details: From=${formattedCustomer}, To=${formattedProvider}, CallerId=${process.env.EXOTEL_CALLER_ID}`);

        // Exotel configuration from environment variables
        const accountSid = process.env.EXOTEL_ACCOUNT_SID;
        const apiKey = process.env.EXOTEL_API_KEY;
        const apiToken = process.env.EXOTEL_API_TOKEN;
        const callerId = process.env.EXOTEL_CALLER_ID;

        if (!accountSid || !apiKey || !apiToken || !callerId) {
            console.error('CRITICAL: Exotel environment variables missing');
            return res.status(500).json({ error: 'Call service not configured on server. Check environment variables.' });
        }

        const exotelUrl = `https://api.exotel.com/v1/Accounts/${accountSid}/Calls/connect.json`;
        const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

        // Form data for Exotel
        const params = new URLSearchParams();
        params.append('From', formattedCustomer);
        params.append('To', formattedProvider);
        params.append('CallerId', callerId);

        const response = await fetch(exotelUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log(`Call initiated between ${customerPhone} and ${providerPhone}`);
            res.json({ message: 'Call connected successfully', sid: responseData.Call?.Sid });
        } else {
            console.error('Exotel API Error:', responseData);
            res.status(response.status).json({
                error: 'Failed to initiate call via partner',
                details: responseData.RestException?.Message || 'Unknown Exotel Error'
            });
        }
    } catch (error) {
        console.error('Internal Call Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/bookings/:id/location', async (req, res) => {
    try {
        const { lat, lng, role } = req.body;
        const update = role === 'provider'
            ? { providerLat: lat, providerLng: lng }
            : { customerLat: lat, customerLng: lng };

        await Booking.findByIdAndUpdate(req.params.id, update);
        res.json({ message: 'Location updated' });
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

// Custom Requests
app.post('/api/custom-requests', async (req, res) => {
    try {
        const newRequest = new CustomRequest(req.body);
        await newRequest.save();
        res.status(201).json({ message: 'Request created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/custom-requests', async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const requests = await CustomRequest.find({
            status: 'pending',
            createdAt: { $gte: fiveMinutesAgo }
        }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/custom-requests/customer/:uid', async (req, res) => {
    try {
        const requests = await CustomRequest.find({ customerUid: req.params.uid }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/custom-requests/:id/status', async (req, res) => {
    try {
        const { status, providerUid } = req.body;

        if (status === 'rejected' && providerUid) {
            // Add provider to rejectedBy array instead of changing global status
            await CustomRequest.findByIdAndUpdate(req.params.id, {
                $addToSet: { rejectedBy: providerUid }
            });
            return res.json({ message: 'Request rejected by provider' });
        }

        await CustomRequest.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/custom-requests/:id/bid', async (req, res) => {
    try {
        const { providerUid, providerName, price } = req.body;
        const request = await CustomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        request.bids.push({ providerUid, providerName, price });
        await request.save();
        res.json({ message: 'Bid submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/custom-requests/:id/accept-bid', async (req, res) => {
    try {
        const { providerUid, price, providerName } = req.body;
        const customReq = await CustomRequest.findById(req.params.id);
        if (!customReq) return res.status(404).json({ error: 'Request not found' });

        customReq.status = 'accepted';
        customReq.acceptedProviderUid = providerUid;
        await customReq.save();

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Create a formal booking
        const newBooking = new Booking({
            customerUid: customReq.customerUid,
            customerName: customReq.customerName,
            providerUid: providerUid,
            providerName: providerName,
            serviceName: customReq.category + " (Custom)",
            status: 'accepted',
            address: customReq.customerName + "'s Location", // In real app, get from customer
            scheduledTime: "ASAP",
            totalAmount: price,
            otp: otp,
            customerLat: customReq.lat,
            customerLng: customReq.lng
        });
        await newBooking.save();

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/custom-requests/:id/direct-accept', async (req, res) => {
    try {
        const { providerUid, providerName } = req.body;
        const customReq = await CustomRequest.findById(req.params.id);
        if (!customReq) return res.status(404).json({ error: 'Request not found' });
        if (customReq.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

        customReq.status = 'accepted';
        customReq.acceptedProviderUid = providerUid;
        await customReq.save();

        // Use the price offered by the customer
        const price = customReq.minPrice || 0;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const newBooking = new Booking({
            customerUid: customReq.customerUid,
            customerName: customReq.customerName,
            providerUid: providerUid,
            providerName: providerName,
            serviceName: customReq.category + " (Custom)",
            status: 'accepted',
            address: customReq.customerName + "'s Location",
            scheduledTime: "ASAP",
            totalAmount: price,
            otp: otp,
            customerLat: customReq.lat,
            customerLng: customReq.lng
        });
        await newBooking.save();

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bookings/:id/complete-payment', async (req, res) => {
    const bookingId = req.params.id;
    console.log(`Starting complete-payment for booking: ${bookingId}`);

    try {
        // 1. Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.error(`Booking not found: ${bookingId}`);
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.paymentStatus === 'paid' && booking.status === 'done') {
            return res.json({ message: 'Payment already completed' });
        }

        // 2. Update booking status
        booking.paymentStatus = 'paid';
        booking.status = 'done';
        await booking.save();
        console.log(`Booking ${bookingId} marked as paid/done`);

        // 3. Credit the provider's wallet
        const providerUid = booking.providerUid;
        if (providerUid) {
            // Get commission percentage from settings (default to 15%)
            let commissionPercent = 15;
            try {
                const setting = await Settings.findOne({ key: 'commission_percentage' });
                if (setting) commissionPercent = Number(setting.value);
            } catch (e) {
                console.error("Error fetching commission setting:", e);
            }

            const partnerEarnings = Math.round(booking.totalAmount * ((100 - commissionPercent) / 100));
            const companyCommission = booking.totalAmount - partnerEarnings;

            const providerUpdate = User.findOneAndUpdate(
                { uid: providerUid },
                { $inc: { walletBalance: partnerEarnings, totalEarnings: partnerEarnings, totalJobs: 1 } }
            );

            const transactionLog = new Transaction({
                userUid: providerUid,
                type: 'credit',
                amount: partnerEarnings,
                title: 'Job Payment',
                description: `Payment for ${booking.serviceName} from ${booking.customerName || 'Customer'} (Commission: ${commissionPercent}% - ₹${companyCommission})`
            }).save();

            // Run wallet update and transaction log in parallel to save time
            await Promise.all([providerUpdate, transactionLog]);
            console.log(`Provider ${providerUid} wallet credited with ${partnerEarnings} (Commission: ${commissionPercent}%)`);
        }

        res.json({ message: 'Payment completed successfully' });
    } catch (error) {
        console.error('Complete Payment Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create Razorpay Order
app.post('/api/payments/create-order', async (req, res) => {
    try {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.error('Razorpay Error: Keys missing in process.env');
            return res.status(500).json({ error: "Razorpay keys are not configured on the server" });
        }

        const instance = new Razorpay({ key_id, key_secret });

        const { amount, bookingId } = req.body;
        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: "INR",
            receipt: `receipt_${bookingId}`,
        };

        const order = await instance.orders.create(options);
        console.log(`Razorpay order created: ${order.id} for booking: ${bookingId}`);
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            keyId: key_id
        });
    } catch (error) {
        console.error('Razorpay Order Error Details:', JSON.stringify(error, null, 2));
        const errorMessage = error.error?.description || error.message || "Failed to create order";
        res.status(500).json({ error: errorMessage });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Admin: Offers
app.get('/api/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/offers', async (req, res) => {
    try {
        const newOffer = new Offer(req.body);
        await newOffer.save();
        res.status(201).json(newOffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/offers/:id', async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Profile Management
app.patch('/api/users/:uid', async (req, res) => {
    try {
        await User.findOneAndUpdate({ uid: req.params.uid }, req.body);
        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/:uid/favorites', async (req, res) => {
    try {
        const { providerUid } = req.body;
        const user = await User.findOne({ uid: req.params.uid });
        if (!user.favorites.includes(providerUid)) {
            user.favorites.push(providerUid);
            await user.save();
        }
        res.json({ message: 'Added to favorites' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:uid/favorites/:providerUid', async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { uid: req.params.uid },
            { $pull: { favorites: req.params.providerUid } }
        );
        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:uid/favorites', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        const providers = await Provider.find({ uid: { $in: user.favorites } });
        res.json(providers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/users/:uid/profile-image', upload.single('profileImage'), async (req, res) => {
    try {
        const uid = req.params.uid;
        if (!req.file) return res.status(400).json({ error: 'No image provided' });

        const fileName = `profiles/${uid}_${Date.now()}.jpg`;
        await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }));
        const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        await User.findOneAndUpdate({ uid }, { profileImage: imageUrl });

        res.json({ message: 'Profile image updated', imageUrl });
    } catch (error) {
        console.error('Profile image update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Address Management
app.post('/api/users/:uid/addresses', async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { uid: req.params.uid },
            { $push: { addresses: req.body } }
        );
        res.status(201).json({ message: 'Address added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:uid/addresses', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        res.json(user.addresses || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:uid/addresses/:addressId', async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { uid: req.params.uid },
            { $pull: { addresses: { _id: req.params.addressId } } }
        );
        res.json({ message: 'Address removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Banners
app.get('/api/banners', async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/banners', upload.single('image'), async (req, res) => {
    try {
        const { title, subtitle } = req.body;
        let imageUrl = '';

        if (req.file) {
            const fileName = `banners/${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        }

        const newBanner = new Banner({ image: imageUrl, title, subtitle });
        await newBanner.save();
        res.status(201).json(newBanner);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/banners/:id', async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Banner deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/banners/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, subtitle } = req.body;
        const update = { title, subtitle };
        if (req.file) {
            const fileName = `banners/${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            update.image = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        }
        await Banner.findByIdAndUpdate(req.params.id, update);
        res.json({ message: 'Banner updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/offers/:id', async (req, res) => {
    try {
        await Offer.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Offer updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/bank-details/:uid', async (req, res) => {
    try {
        await User.findOneAndUpdate({ uid: req.params.uid }, { bankDetails: req.body });
        res.json({ message: 'Bank details updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Settings
app.get('/api/admin/settings', async (req, res) => {
    try {
        const settings = await Settings.find();
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        // Ensure default commission exists in response if not in DB
        if (!settingsMap.commission_percentage) settingsMap.commission_percentage = 15;

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        await Settings.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.json({ message: 'Setting updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/provider/performance/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        const allBookings = await Booking.find({ providerUid: uid });
        const completedBookings = allBookings.filter(b => b.status === 'done');
        const user = await User.findOne({ uid });
        const provider = await Provider.findOne({ uid });

        const totalEarned = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalWork = completedBookings.length;

        // Completion Rate
        const totalAssigned = allBookings.length;
        const completionRate = totalAssigned > 0 ? Math.round((totalWork / totalAssigned) * 100) : 100;

        // Weekly Earnings (Last 7 days)
        const weeklyEarnings = new Array(7).fill(0);
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];

            weeklyEarnings[i] = completedBookings
                .filter(b => new Date(b.createdAt).toISOString().split('T')[0] === dateStr)
                .reduce((sum, b) => sum + b.totalAmount, 0);
        }

        // Monthly Earnings (Last 4 weeks)
        const monthlyEarnings = new Array(4).fill(0);
        for (let i = 0; i < 4; i++) {
            const start = new Date();
            start.setDate(today.getDate() - (4 - i) * 7);
            const end = new Date();
            end.setDate(today.getDate() - (3 - i) * 7);

            monthlyEarnings[i] = completedBookings
                .filter(b => b.createdAt >= start && b.createdAt < end)
                .reduce((sum, b) => sum + b.totalAmount, 0);
        }

        // Activity Log for current month
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dailyActivity = [];
        const onlineDates = provider?.dailyOnline || [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dailyActivity.push({
                date: dateStr,
                isOnline: onlineDates.includes(dateStr)
            });
        }

        res.json({
            totalEarned,
            totalWork,
            weekly: weeklyEarnings,
            monthly: monthlyEarnings,
            joinDate: user?.createdAt || new Date(),
            dailyActivity,
            averageRating: provider?.rating || 0,
            completionRate: completionRate,
            onTimeArrival: 95
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
