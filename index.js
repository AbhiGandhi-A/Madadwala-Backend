const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
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
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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



// Root Route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Madadwala - Home Services Marketplace</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
                .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #1E5631; margin-bottom: 10px; }
                .mission { font-style: italic; color: #666; margin-bottom: 30px; border-left: 4px solid #1E5631; padding-left: 15px; }
                h2 { color: #1E5631; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; }
                .price-list { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-top: 20px; }
                .price-item { padding: 10px; border-bottom: 1px solid #eee; }
                .price-val { font-weight: bold; color: #1E5631; padding: 10px; border-bottom: 1px solid #eee; text-align: right; }
                .footer { margin-top: 40px; font-size: 0.9em; color: #888; text-align: center; }
                .contact { background: #E8F5E9; padding: 15px; border-radius: 8px; margin-top: 20px; font-weight: bold; color: #1E5631; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Madadwala</h1>
                <p class="mission">"Empowering homes through verified professional care and reliable local service."</p>

                <p>Madadwala is a hyperlocal service marketplace connecting households with verified service professionals. We ensure quality, transparency, and safety for all home maintenance needs.</p>

                <h2>Our Service Catalog & Pricing</h2>
                <div class="price-list">
                    <div class="price-item">Electrical - Fan Repair / Fitting</div><div class="price-val">₹150 - ₹500</div>
                    <div class="price-item">Electrical - House Wiring (per pt)</div><div class="price-val">₹200 - ₹1500</div>
                    <div class="price-item">Plumbing - Tap/Leakage Repair</div><div class="price-val">₹100 - ₹800</div>
                    <div class="price-item">Plumbing - Tank Cleaning</div><div class="price-val">₹1000 - ₹2500</div>
                    <div class="price-item">Cleaning - Full Home Deep Clean</div><div class="price-val">₹1999 - ₹5999</div>
                    <div class="price-item">Appliance Repair & Service</div><div class="price-val">₹299 - ₹1200</div>
                </div>

                <h2>Business Operations</h2>
                <p>The Madadwala payment gateway is integrated into our mobile platform to facilitate secure wallet top-ups and direct service payments for completed jobs.</p>

                <div class="contact">
                    Support Contact: 9879338393<br>
                    Email: madadwalasupport@gmail.com
                </div>

                <div class="footer">
                    &copy; ${new Date().getFullYear()} Madadwala Services. All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `);
});

// MongoDB Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 20,
            minPoolSize: 5,
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
    kycRejected: { type: Boolean, default: false },
    kycRejectionReason: String,
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
    isOnline: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    favorites: [{ type: String }], // Array of provider UIDs
    addresses: [{
        label: String, // 'Home', 'Work', etc.
        fullAddress: String,
        lat: Number,
        lng: Number
    }],
    fcmToken: String,
    pendingReferralDiscount: { type: Number, default: 0 },
    dailyOnline: [{ type: String }], // Array of dates 'YYYY-MM-DD'
    activityLog: [{
        event: String,
        description: String,
        timestamp: { type: Date, default: Date.now }
    }],
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
    issueImages: [String],
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

// Operational City Schema
const operationalCitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const OperationalCity = mongoose.model('OperationalCity', operationalCitySchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
});
const Settings = mongoose.model('Settings', settingsSchema);

// Support Message Schema
const supportMessageSchema = new mongoose.Schema({
    senderUid: { type: String, required: true },
    receiverUid: { type: String, required: true },
    message: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});
const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

// Support Session Schema
const supportSessionSchema = new mongoose.Schema({
    userUid: { type: String, required: true, unique: true },
    status: { type: String, enum: ['bot', 'waiting', 'active', 'closed'], default: 'bot' },
    lastUpdated: { type: Date, default: Date.now }
});
const SupportSession = mongoose.model('SupportSession', supportSessionSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
    reporterUid: { type: String, required: true },
    reportedUid: { type: String, required: true },
    reason: { type: String, required: true },
    description: String,
    evidenceUrls: [String],
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', reportSchema);

// Booking Message Schema
const bookingMessageSchema = new mongoose.Schema({
    bookingId: { type: String, required: true },
    senderUid: { type: String, required: true },
    message: { type: String },
    imageUrl: String,
    timestamp: { type: Date, default: Date.now }
});
const BookingMessage = mongoose.model('BookingMessage', bookingMessageSchema);

// Location Interest Schema
const locationInterestSchema = new mongoose.Schema({
    uid: String,
    cityName: { type: String, required: true },
    fcmToken: String,
    createdAt: { type: Date, default: Date.now }
});
const LocationInterest = mongoose.model('LocationInterest', locationInterestSchema);

// FCM Notification Helper
const sendFCMNotification = async (uid, title, body, data = {}) => {
    try {
        const user = await User.findOne({ uid });
        if (!user || !user.fcmToken) {
            console.log(`FCM: Skipping notification for ${uid}, no token found.`);
            return;
        }

        const isCall = data.type === 'call' || data.callId;

        const message = {
            data: { ...data, title, body },
            token: user.fcmToken,
            android: {
                priority: 'high'
            }
        };

        // For standard notifications, include the notification block
        // For calls, we send data-only to ensure onMessageReceived is called in the app
        if (!isCall) {
            message.notification = { title, body };
            message.android.notification = {
                channel_id: 'madadwala_notifications'
            };
        }

        const response = await admin.messaging().send(message);
        console.log(`FCM: Notification sent to ${uid}: ${response}`);
    } catch (error) {
        console.error(`FCM: Error sending to ${uid}:`, error.message);
    }
};

const logActivity = async (uid, event, description) => {
    try {
        await User.findOneAndUpdate(
            { uid },
            { $push: { activityLog: { $each: [{ event, description }], $slice: -50 } } }
        );
    } catch (err) {
        console.error('Activity Log Error:', err.message);
    }
};

const broadcastFCMNotification = async (uids, title, body, data = {}) => {
    try {
        const users = await User.find({ uid: { $in: uids }, fcmToken: { $exists: true } });
        const tokens = [...new Set(users.map(u => u.fcmToken).filter(t => t))];

        if (tokens.length === 0) return;

        const messageTemplate = {
            notification: { title, body },
            data: { ...data, title, body },
            android: {
                priority: 'high',
                notification: {
                    channel_id: 'madadwala_notifications'
                }
            }
        };

        for (let i = 0; i < tokens.length; i += 500) {
            const chunk = tokens.slice(i, i + 500);
            const message = { ...messageTemplate, tokens: chunk };
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`FCM: Broadcast sent to ${response.successCount} users.`);
        }
    } catch (error) {
        console.error(`FCM: Error in broadcast:`, error.message);
    }
};

// Call Session Schema
const callSessionSchema = new mongoose.Schema({
    bookingId: { type: String, required: true },
    customerId: { type: String, required: true },
    partnerId: { type: String, required: true },
    status: { type: String, enum: ['ringing', 'accepted', 'completed', 'missed', 'declined'], default: 'ringing' },
    startTime: Date,
    endTime: Date,
    duration: Number, // in seconds
    createdAt: { type: Date, default: Date.now }
});
const CallSession = mongoose.model('CallSession', callSessionSchema);

// Interaction Schema (for Profile-based Chat/Call)
const interactionSchema = new mongoose.Schema({
    _id: String, // Deterministic ID from frontend
    participants: [String], // [uid1, uid2]
    createdAt: { type: Date, default: Date.now }
});
const Interaction = mongoose.model('Interaction', interactionSchema);

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
app.post('/api/users/fcm-token', async (req, res) => {
    const { uid, fcmToken } = req.body;
    try {
        await User.findOneAndUpdate({ uid }, { fcmToken });
        logActivity(uid, 'SESSION_START', 'User logged in and updated FCM token');
        res.json({ message: 'FCM token updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/register', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'aadhaarImage', maxCount: 1 }
]), async (req, res) => {
    console.log(`Starting registration for UID: ${req.body.uid}`);
    try {
        const { uid, phoneNumber, role, name, email, category, profession, aadhaarNumber, referralCode } = req.body;

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

        // Process Referral Logic
        if (referralCode && referralCode.startsWith('MW')) {
            const last6 = referralCode.substring(2).toUpperCase();
            // Find inviter whose UID ends with these 6 chars
            const inviter = await User.findOne({ uid: { $regex: new RegExp(`${last6}$`, 'i') } });

            if (inviter && inviter.uid !== uid) {
                const inviteeDiscount = 50;
                const inviterReward = 10;

                // Set Discount for Invitee (New User)
                newUser.pendingReferralDiscount = inviteeDiscount;
                await newUser.save();

                // Credit Inviter
                inviter.walletBalance += inviterReward;
                await inviter.save();
                await new Transaction({
                    userUid: inviter.uid,
                    type: 'credit',
                    amount: inviterReward,
                    title: 'Referral Reward',
                    description: `Bonus for inviting ${name || 'a new member'}`
                }).save();

                // Notify Inviter
                sendFCMNotification(
                    inviter.uid,
                    'Referral Reward Credited!',
                    `You earned ₹${inviterReward} because ${name || 'someone'} joined using your code.`,
                    { screen: 'wallet' }
                );

                // Notify Invitee
                sendFCMNotification(
                    uid,
                    'Welcome Discount!',
                    `You have a ₹${inviteeDiscount} discount available for your first booking!`,
                    { screen: 'home' }
                );
            }
        }

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

app.get('/api/withdrawals/history/:uid', async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ providerUid: req.params.uid }).sort({ createdAt: -1 });
        res.json(withdrawals);
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

app.get('/api/admin/withdrawals/all', async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });
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

                sendFCMNotification(
                    withdrawal.providerUid,
                    'Withdrawal Rejected',
                    `Your withdrawal request of ₹${withdrawal.amount} was rejected. Reason: ${withdrawal.rejectionReason}. The amount has been refunded to your wallet.`,
                    { screen: 'withdrawals' }
                );
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

                    sendFCMNotification(
                        withdrawal.providerUid,
                        'Withdrawal Successful!',
                        `Your withdrawal of ₹${withdrawal.amount} has been processed and sent to your bank account.`,
                        { screen: 'withdrawals' }
                    );

                    return res.json({ message: 'Payout successful', payoutId: payout.id });
                } else {
                    // Fallback if RazorpayX is not configured but admin wants to mark as paid
                    withdrawal.status = 'paid';
                    withdrawal.payoutId = 'MANUAL_' + Date.now();
                    await withdrawal.save();

                    sendFCMNotification(
                        withdrawal.providerUid,
                        'Withdrawal Successful!',
                        `Your withdrawal of ₹${withdrawal.amount} has been marked as paid.`,
                        { screen: 'withdrawals' }
                    );

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

// Support Chat Endpoints
app.get('/api/support/messages/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const messages = await SupportMessage.find({
            $or: [
                { senderUid: userId, receiverUid: 'admin' },
                { senderUid: 'admin', receiverUid: userId }
            ]
        }).sort({ timestamp: 1 });

        // Mark as read when admin fetches
        // In a real app, you'd distinguish who is fetching
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/support/messages', async (req, res) => {
    try {
        const newMessage = new SupportMessage(req.body);
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/support/chats', async (req, res) => {
    try {
        const messages = await SupportMessage.aggregate([
            {
                $project: {
                    userUid: { $cond: [{ $eq: ['$senderUid', 'admin'] }, '$receiverUid', '$senderUid'] },
                    message: 1,
                    timestamp: 1,
                    isAdmin: 1,
                    read: 1
                }
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$userUid',
                    lastMessage: { $first: '$message' },
                    lastTimestamp: { $first: '$timestamp' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$isAdmin', false] }, { $eq: ['$read', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { lastTimestamp: -1 } }
        ]);

        const populatedChats = await Promise.all(messages.map(async (chat) => {
            const user = await User.findOne({ uid: chat._id });
            const session = await SupportSession.findOne({ userUid: chat._id });
            return {
                userUid: chat._id,
                userName: user ? user.name : 'User',
                lastMessage: chat.lastMessage,
                lastTimestamp: chat.lastTimestamp,
                unreadCount: chat.unreadCount,
                status: session ? session.status : 'active'
            };
        }));

        res.json(populatedChats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/support/status/:userId', async (req, res) => {
    try {
        const { status } = req.body;
        await SupportSession.findOneAndUpdate(
            { userUid: req.params.userId },
            { status, lastUpdated: Date.now() },
            { upsert: true }
        );
        res.json({ message: 'Status updated' });
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

// Admin: Reject provider
app.post('/api/admin/reject-provider', async (req, res) => {
    const { uid, reason } = req.body;
    try {
        await User.findOneAndUpdate({ uid }, {
            isVerified: false,
            kycRejected: true,
            kycRejectionReason: reason
        });
        await Provider.findOneAndUpdate({ uid }, { isVerified: false });

        // Notify Provider
        sendFCMNotification(
            uid,
            'KYC Registration Rejected',
            `Your application was not approved. Reason: ${reason}. Please update your details.`,
            { screen: 'profile' }
        );

        res.json({ message: 'Provider application rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// KYC Update (Re-upload)
app.patch('/api/users/:uid/kyc', upload.single('aadhaarImage'), async (req, res) => {
    try {
        const { uid } = req.params;
        const { aadhaarNumber } = req.body;
        const updateData = { kycRejected: false }; // Reset rejection status on re-submit

        if (aadhaarNumber) updateData.aadhaarNumber = aadhaarNumber;

        if (req.file) {
            const fileName = `aadhaar/${uid}_${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            updateData.aadhaarImage = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        }

        const user = await User.findOne({ uid });
        if (user.isVerified) {
            return res.status(400).json({ error: 'Account already verified' });
        }

        await User.findOneAndUpdate({ uid }, updateData);
        res.json({ message: 'KYC details updated successfully. Under review.' });
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
    const { category, lat, lng } = req.query;
    try {
        const query = { isVerified: true };
        if (category) query.category = category;
        const providers = await Provider.find(query);

        // Helper to calculate distance
        const getDistance = (lat1, lon1, lat2, lon2) => {
            if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // Filter by 50km if lat/lng provided
        let filteredProviders = providers;
        if (lat && lng) {
            filteredProviders = providers.filter(p => {
                const distance = getDistance(parseFloat(lat), parseFloat(lng), p.lat, p.lng);
                return distance <= 50;
            });
        }

        // Fetch details from User collection for each provider
        const providersWithDetails = await Promise.all(filteredProviders.map(async (p) => {
            const user = await User.findOne({ uid: p.uid });

            let distanceStr = "Nearby";
            if (lat && lng && p.lat && p.lng) {
                const dist = getDistance(parseFloat(lat), parseFloat(lng), p.lat, p.lng);
                distanceStr = `${dist.toFixed(1)} km away`;
            }

            return {
                ...p.toObject(),
                distance: distanceStr,
                profileImage: user ? user.profileImage : null,
                isOnline: user ? user.isOnline : false,
                totalJobs: user ? user.totalJobs : 0,
                totalEarnings: user ? user.totalEarnings : 0,
                createdAt: user ? user.createdAt : null
            };
        }));

        res.json(providersWithDetails);
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
        const reviews = await Review.find({ providerUid: req.params.uid }).sort({ createdAt: -1 });

        const providerDetails = {
            ...provider.toObject(),
            profileImage: user ? user.profileImage : null,
            email: user ? user.email : null,
            phoneNumber: user ? user.phoneNumber : null,
            aadhaarNumber: user ? user.aadhaarNumber : null,
            verificationDate: user ? user.verificationDate : null,
            profession: user ? user.profession : null,
            isOnline: user ? user.isOnline : false,
            totalJobs: user ? user.totalJobs : 0,
            totalEarnings: user ? user.totalEarnings : 0,
            createdAt: user ? user.createdAt : null
        };

        res.json({ provider: providerDetails, services, reviews });
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

        // Notify via socket
        io.emit('user_status_change', { uid: req.params.uid, isAvailable });

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
app.post('/api/interactions/init', async (req, res) => {
    const { id, participants } = req.body;
    try {
        await Interaction.findOneAndUpdate(
            { _id: id },
            { participants },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/call/start', async (req, res) => {
    const { bookingId, customerId, partnerId, callerId } = req.body;
    try {
        // Backend checks
        let booking = null;
        if (mongoose.Types.ObjectId.isValid(bookingId)) {
            booking = await Booking.findById(bookingId);
        }

        if (booking) {
            if (booking.status === 'cancelled' || booking.status === 'done') {
                return res.status(400).json({ success: false, message: "Booking is not active" });
            }
        } else {
            // If not a booking, check if it's a registered interaction
            const interaction = await Interaction.findById(bookingId);
            if (!interaction && (!customerId || !partnerId)) {
                return res.status(404).json({ success: false, message: "Booking or Interaction not found" });
            }
        }

        const callSession = new CallSession({
            bookingId,
            customerId: customerId || "",
            partnerId: partnerId || "",
            status: 'ringing'
        });
        await callSession.save();

        // Determine who is receiving the call
        // If callerId is provided, use it to find the receiver.
        // Otherwise fallback to old behavior (customer calling partner)
        let receiverId = partnerId;
        let finalCallerId = customerId;

        if (callerId) {
            finalCallerId = callerId;
            receiverId = (callerId === customerId) ? partnerId : customerId;
        }

        // Notify Receiver via Socket
        const caller = await User.findOne({ uid: finalCallerId });
        let callerName = caller ? caller.name : "Partner";
        if (finalCallerId === 'admin') callerName = "Madadwala Admin";

        if (io) {
            console.log(`Emitting incoming_call from ${finalCallerId} to receiver: ${receiverId}`);
            io.to(receiverId).emit("incoming_call", {
                callId: callSession._id,
                callerName: callerName,
                customerName: callerName, // Backwards compatibility
                callerImage: caller ? caller.profileImage : null,
                customerImage: caller ? caller.profileImage : null, // Backwards compatibility
                bookingId: bookingId,
                callerId: finalCallerId
            });
        }

        // ALSO Notify via FCM for cases where app is closed
        sendFCMNotification(
            receiverId,
            'Incoming Call',
            `${callerName} is calling you regarding your booking.`,
            {
                type: 'call',
                screen: 'voice_call',
                callId: callSession._id.toString(),
                callerName: callerName,
                callerImage: caller ? caller.profileImage : "",
                bookingId: bookingId,
                callerId: finalCallerId
            }
        );

        res.json({
            success: true,
            callId: callSession._id
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/bookings', upload.array('issueImages', 5), async (req, res) => {
    console.log('Creating new booking (Multipart):', req.body);
    try {
        const { customerUid, customerName, providerUid, providerName, serviceName, address, scheduledTime, totalAmount, customerLat, customerLng } = req.body;

        const issueImagesUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = `bookings/${customerUid}_${Date.now()}_${file.originalname}`;
                await s3.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
                issueImagesUrls.push(`${process.env.R2_PUBLIC_URL}/${fileName}`);
            }
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const newBooking = new Booking({
            customerUid,
            customerName,
            providerUid,
            providerName,
            serviceName,
            address,
            scheduledTime,
            totalAmount: Number(totalAmount),
            customerLat: customerLat ? Number(customerLat) : null,
            customerLng: customerLng ? Number(customerLng) : null,
            issueImages: issueImagesUrls,
            otp
        });

        await newBooking.save();
        console.log(`Booking created successfully with ID: ${newBooking._id}`);

        // Reset Referral Discount if it was used
        await User.findOneAndUpdate({ uid: customerUid }, { $set: { pendingReferralDiscount: 0 } });

        // Log Activity
        logActivity(customerUid, 'BOOKING_CREATED', `Booked ${serviceName} for ₹${totalAmount}`);
        logActivity(providerUid, 'NEW_JOB_RECEIVED', `Received a new booking for ${serviceName}`);

        // Notify Provider
        sendFCMNotification(
            providerUid,
            'New Booking Received!',
            `You have a new booking from ${customerName} for ${serviceName}.`,
            { bookingId: newBooking._id.toString(), screen: 'active_job' }
        );

        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Booking creation error:', error);
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

        // Ensure provider details are present for bookings
        const enrichedBookings = await Promise.all(bookings.map(async (b) => {
            let bookingObj = b.toObject();
            if (bookingObj.providerUid) {
                const provider = await User.findOne({ uid: bookingObj.providerUid });
                if (provider) {
                    if (!bookingObj.providerName) bookingObj.providerName = provider.name;
                    bookingObj.providerImage = provider.profileImage;
                }
            }
            return bookingObj;
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

app.patch('/api/bookings/:id/cancel', async (req, res) => {
    try {
        const { reason, cancelledBy } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (['done', 'cancelled'].includes(booking.status)) {
            return res.status(400).json({ error: 'Booking already completed or cancelled' });
        }

        const oldStatus = booking.status;
        booking.status = 'cancelled';
        booking.partnerComment = reason || `Cancelled by ${cancelledBy || 'user'}`;

        // Handle Refund if Paid
        let refundProcessed = false;
        if (booking.paymentStatus === 'paid') {
            const user = await User.findOne({ uid: booking.customerUid });
            if (user) {
                user.walletBalance += booking.totalAmount;
                await user.save();

                await new Transaction({
                    userUid: booking.customerUid,
                    type: 'credit',
                    amount: booking.totalAmount,
                    title: 'Booking Refund',
                    description: `Refund for cancelled booking: ${booking.serviceName}`
                }).save();

                booking.paymentStatus = 'pending'; // Reset or mark as refunded
                refundProcessed = true;
                logActivity(booking.customerUid, 'REFUND_RECEIVED', `Received refund of ₹${booking.totalAmount} for cancelled job`);
            }
        }

        await booking.save();

        // Notify other party
        const notifyUid = (cancelledBy === 'provider' || booking.providerUid === cancelledBy)
            ? booking.customerUid
            : booking.providerUid;

        const partyName = (cancelledBy === 'provider') ? 'Partner' : 'Customer';

        sendFCMNotification(
            notifyUid,
            'Booking Cancelled',
            `The booking for ${booking.serviceName} has been cancelled by the ${partyName}.`,
            { bookingId: booking._id.toString(), screen: 'bookings' }
        );

        res.json({
            success: true,
            message: refundProcessed ? 'Booking cancelled and refund processed to wallet' : 'Booking cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/bookings/:id/reschedule', async (req, res) => {
    try {
        const { scheduledTime } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (['done', 'cancelled'].includes(booking.status)) {
            return res.status(400).json({ error: 'Cannot reschedule completed or cancelled booking' });
        }

        const oldTime = booking.scheduledTime;
        booking.scheduledTime = scheduledTime;
        await booking.save();

        // Notify Provider
        sendFCMNotification(
            booking.providerUid,
            'Booking Rescheduled',
            `The booking for ${booking.serviceName} has been moved from ${oldTime} to ${scheduledTime}.`,
            { bookingId: booking._id.toString(), screen: 'active_job' }
        );

        res.json({ success: true, message: 'Booking rescheduled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat: Get messages for a booking
app.get('/api/bookings/:id/messages', async (req, res) => {
    try {
        const messages = await BookingMessage.find({ bookingId: req.params.id }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat: Save a new message
app.post('/api/bookings/messages', upload.single('chatImage'), async (req, res) => {
    try {
        const { bookingId, senderUid, message } = req.body;
        let imageUrl = null;

        if (req.file) {
            const fileName = `chat/${bookingId}_${Date.now()}.jpg`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
                Key: fileName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            }));
            imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
        }

        const newMessage = new BookingMessage({
            bookingId,
            senderUid,
            message: message || '',
            imageUrl
        });
        await newMessage.save();

        // Notify Receiver via FCM
        const booking = await Booking.findById(bookingId);
        let receiverUid = null;
        if (booking) {
            receiverUid = (senderUid === booking.customerUid) ? booking.providerUid : booking.customerUid;
        } else {
            const interaction = await Interaction.findById(bookingId);
            if (interaction) {
                receiverUid = interaction.participants.find(p => p !== senderUid);
            }
        }

        if (receiverUid) {
            const sender = await User.findOne({ uid: senderUid });
            sendFCMNotification(
                receiverUid,
                `New message from ${sender ? sender.name : 'Madadwala'}`,
                imageUrl ? 'Sent an image' : message,
                { bookingId: bookingId.toString(), type: 'chat', screen: 'chat' }
            );
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        let bookingObj = booking.toObject();
        if (bookingObj.providerUid) {
            // Priority 1: Fetch from User collection
            const user = await User.findOne({ uid: bookingObj.providerUid });
            if (user && user.profileImage) {
                bookingObj.providerImage = user.profileImage;
                bookingObj.providerPhone = user.phoneNumber;
            }

            // Priority 2: Fetch from Provider collection if still missing
            if (!bookingObj.providerImage) {
                const provider = await Provider.findOne({ uid: bookingObj.providerUid });
                if (provider && provider.profileImage) {
                    bookingObj.providerImage = provider.profileImage;
                }
            }

            // Ensure name is present
            if (!bookingObj.providerName) {
                const partner = await User.findOne({ uid: bookingObj.providerUid });
                bookingObj.providerName = partner ? partner.name : "Partner";
            }
        }

        if (bookingObj.customerUid) {
            const customer = await User.findOne({ uid: bookingObj.customerUid });
            if (customer) {
                bookingObj.customerImage = customer.profileImage;
                if (!bookingObj.customerName) bookingObj.customerName = customer.name;
                if (!bookingObj.customerPhone) bookingObj.customerPhone = customer.phoneNumber;
            }
        }
        res.json(bookingObj);
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

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Check wallet balance if accepting
        if (status === 'accepted') {
            const provider = await User.findOne({ uid: booking.providerUid });
            if (provider && provider.walletBalance <= -100) {
                return res.status(400).json({
                    error: 'Insufficient wallet balance. Please maintain a balance above -₹100 to accept new bookings.'
                });
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });

        // Log Activity
        if (status && booking) {
            logActivity(booking.providerUid, 'STATUS_UPDATE', `Updated booking ${booking._id} status to ${status}`);
            logActivity(booking.customerUid, 'STATUS_RECEIVED', `Booking ${booking._id} status changed to ${status}`);
        }

        // Notify Customer
        if (status && booking) {
            let title = 'Booking Update';
            let message = `Your booking for ${booking.serviceName} status is now: ${status.replace('_', ' ')}.`;
            let screen = 'tracking';

            if (status === 'accepted') {
                title = 'Booking Accepted!';
                message = `${booking.providerName} has accepted your booking for ${booking.serviceName}.`;
            } else if (status === 'on_the_way') {
                title = 'Partner is on the way!';
                message = `${booking.providerName} is heading to your location.`;
            } else if (status === 'arrived') {
                title = 'Partner Arrived!';
                message = `${booking.providerName} has arrived at your location.`;
            } else if (status === 'done') {
                title = 'Service Completed!';
                message = `Your service for ${booking.serviceName} has been completed. Please proceed to payment.`;
                screen = 'payment';
            }

            sendFCMNotification(
                booking.customerUid,
                title,
                message,
                { bookingId: booking._id.toString(), screen: screen }
            );
        }

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

app.patch('/api/bookings/:id/location', async (req, res) => {
    try {
        const { lat, lng, role } = req.body;
        const update = role === 'provider'
            ? { providerLat: lat, providerLng: lng }
            : { customerLat: lat, customerLng: lng };

        await Booking.findByIdAndUpdate(req.params.id, update);

        // Notify via Socket for real-time tracking
        if (io) {
            io.to(req.params.id).emit('location_update', { lat, lng, role });
        }

        res.json({ message: 'Location updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reviews
app.get('/api/reviews/booking/:bookingId', async (req, res) => {
    try {
        const review = await Review.findOne({ bookingId: req.params.bookingId });
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { bookingId, providerUid, rating } = req.body;

        // Check if review already exists for this booking
        const existing = await Review.findOne({ bookingId });
        if (existing) {
            return res.status(400).json({ error: 'Review already submitted for this booking' });
        }

        const newReview = new Review(req.body);
        await newReview.save();

        // Update provider rating
        const reviews = await Review.find({ providerUid });
        const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;

        await Provider.findOneAndUpdate(
            { uid: providerUid },
            { rating: parseFloat(avgRating.toFixed(1)), reviewCount: reviews.length }
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

        // Broadcast to relevant providers
        const providers = await Provider.find({
            category: newRequest.category,
            isAvailable: true,
            isVerified: true
        });
        const uids = providers.map(p => p.uid);

        broadcastFCMNotification(
            uids,
            'New Help Request!',
            `A new request for ${newRequest.category} is available near you.`,
            { requestId: newRequest._id.toString(), screen: 'provider_dashboard' }
        );

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
        const user = await User.findOne({ uid: providerUid });
        if (user && user.walletBalance <= -100) {
            return res.status(400).json({
                error: 'Insufficient wallet balance. Please maintain a balance above -₹100 to place bids.'
            });
        }

        const request = await CustomRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        request.bids.push({ providerUid, providerName, price });
        await request.save();

        // Notify Customer
        sendFCMNotification(
            request.customerUid,
            'New Bid Received!',
            `${providerName} has placed a bid of ₹${price} on your request.`,
            { requestId: request._id.toString(), screen: 'notifications' }
        );

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
            scheduledTime: "Urgent",
            totalAmount: price,
            otp: otp,
            customerLat: customReq.lat,
            customerLng: customReq.lng
        });
        await newBooking.save();

        // Notify Provider
        sendFCMNotification(
            providerUid,
            'Job Confirmed!',
            `Your bid was accepted by ${customReq.customerName}. Job started!`,
            { bookingId: newBooking._id.toString(), screen: 'active_job' }
        );

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/custom-requests/:id/direct-accept', async (req, res) => {
    try {
        const { providerUid, providerName } = req.body;
        const user = await User.findOne({ uid: providerUid });
        if (user && user.walletBalance <= -100) {
            return res.status(400).json({
                error: 'Insufficient wallet balance. Please maintain a balance above -₹100 to accept bookings.'
            });
        }

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
            scheduledTime: "Urgent",
            totalAmount: price,
            otp: otp,
            customerLat: customReq.lat,
            customerLng: customReq.lng
        });
        await newBooking.save();

        // Notify Provider
        sendFCMNotification(
            providerUid,
            'Job Confirmed!',
            `Your bid was accepted by ${customReq.customerName}. Job started!`,
            { bookingId: newBooking._id.toString(), screen: 'active_job' }
        );

        res.status(201).json(newBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/bookings/:id/complete-payment', async (req, res) => {
    const bookingId = req.params.id;
    const { amount } = req.body;
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

        const finalAmount = amount ? Number(amount) : booking.totalAmount;

        // 2. Update booking status
        booking.paymentStatus = 'paid';
        booking.status = 'done';
        if (amount) booking.totalAmount = finalAmount;
        await booking.save();
        console.log(`Booking ${bookingId} marked as paid/done`);

        logActivity(booking.customerUid, 'PAYMENT_COMPLETED', `Paid ₹${finalAmount} for ${booking.serviceName}`);

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

            const partnerEarnings = Math.round(finalAmount * ((100 - commissionPercent) / 100));
            const companyCommission = finalAmount - partnerEarnings;

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

app.post('/api/bookings/:id/pay-from-wallet', async (req, res) => {
    const bookingId = req.params.id;
    const { customerUid, amount } = req.body;

    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.paymentStatus === 'paid') return res.status(400).json({ error: 'Already paid' });

        const customer = await User.findOne({ uid: customerUid });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        const finalAmount = amount ? Number(amount) : booking.totalAmount;

        if (customer.walletBalance < finalAmount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        // 1. Deduct from customer
        customer.walletBalance -= finalAmount;
        await customer.save();

        await new Transaction({
            userUid: customerUid,
            type: 'debit',
            amount: finalAmount,
            title: 'Booking Payment',
            description: `Payment for ${booking.serviceName}`
        }).save();

        // 2. Update booking
        booking.paymentStatus = 'paid';
        booking.status = 'done';
        // Update booking amount if it was discounted
        if (amount) booking.totalAmount = finalAmount;
        await booking.save();

        // 3. Credit provider
        const providerUid = booking.providerUid;
        if (providerUid) {
            let commissionPercent = 15;
            const setting = await Settings.findOne({ key: 'commission_percentage' });
            if (setting) commissionPercent = Number(setting.value);

            const partnerEarnings = Math.round(finalAmount * ((100 - commissionPercent) / 100));
            const companyCommission = finalAmount - partnerEarnings;

            await User.findOneAndUpdate(
                { uid: providerUid },
                { $inc: { walletBalance: partnerEarnings, totalEarnings: partnerEarnings, totalJobs: 1 } }
            );

            await new Transaction({
                userUid: providerUid,
                type: 'credit',
                amount: partnerEarnings,
                title: 'Job Payment',
                description: `Payment for ${booking.serviceName} from ${booking.customerName} (Wallet Payment)`
            }).save();
        }

        logActivity(customerUid, 'PAYMENT_WALLET', `Paid ₹${finalAmount} using wallet for ${booking.serviceName}`);
        res.json({ message: 'Payment successful using wallet' });
    } catch (error) {
        console.error('Wallet Payment Error:', error.message);
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

        const { amount, bookingId, type, uid } = req.body;
        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: "INR",
            receipt: type === 'wallet' ? `wallet_${uid}_${Date.now()}` : `receipt_${bookingId}`,
        };

        const order = await instance.orders.create(options);
        console.log(`Razorpay order created: ${order.id} for ${type || 'booking'}: ${bookingId || uid}`);
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

// Verify Wallet Payment
app.post('/api/payments/verify-wallet', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, uid, amount } = req.body;

    try {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            // Payment is verified
            const user = await User.findOne({ uid });
            if (!user) return res.status(404).json({ error: 'User not found' });

            user.walletBalance += Number(amount);
            await user.save();

            // Log transaction
            const transaction = new Transaction({
                userUid: uid,
                type: 'credit',
                amount: Number(amount),
                title: 'Wallet Top-up',
                description: `Successfully added ₹${amount} to wallet via Razorpay`
            });
            await transaction.save();

            logActivity(uid, 'WALLET_TOPUP', `Added ₹${amount} to wallet`);

            res.json({ success: true, message: 'Wallet updated successfully', newBalance: user.walletBalance });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Wallet Verification Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log(`[Socket] New client connected: ${socket.id}`);

    socket.on('join', async (userId) => {
        socket.userId = userId;
        socket.join(userId);
        console.log(`[Socket] User ${userId} joined their room (Socket ID: ${socket.id})`);

        // Update online status
        await User.findOneAndUpdate({ uid: userId }, { isOnline: true });
        io.emit('user_status_change', { uid: userId, isOnline: true });
    });

    socket.on('join_booking', (bookingId) => {
        socket.join(bookingId);
        console.log(`[Socket] Socket ${socket.id} joined booking room: ${bookingId}`);
    });

    socket.on('send_message', async (data) => {
        const { bookingId, senderUid, message, imageUrl } = data;
        console.log(`[Socket] New message for booking ${bookingId} from ${senderUid}`);
        // Broadcast to everyone in the booking room (including the sender for simple confirmation if needed, or just others)
        io.to(bookingId).emit('receive_message', data);

        // Notify Receiver via FCM (for background/inactive users)
        try {
            const booking = await Booking.findById(bookingId);
            let receiverUid = null;
            if (booking) {
                receiverUid = (senderUid === booking.customerUid) ? booking.providerUid : booking.customerUid;
            } else {
                const interaction = await Interaction.findById(bookingId);
                if (interaction) {
                    receiverUid = interaction.participants.find(p => p !== senderUid);
                }
            }

            if (receiverUid) {
                const sender = await User.findOne({ uid: senderUid });
                sendFCMNotification(
                    receiverUid,
                    `New message from ${sender ? sender.name : 'Madadwala'}`,
                    imageUrl ? 'Sent an image' : message,
                    { bookingId: bookingId.toString(), type: 'chat', screen: 'chat' }
                );
            }
        } catch (err) {
            console.error('Error sending socket-chat FCM:', err.message);
        }
    });

    socket.on('update_location', (data) => {
        const { bookingId, lat, lng, role } = data;
        if (bookingId) {
            // Instant broadcast to anyone else in the booking room (e.g. the customer)
            io.to(bookingId).emit('location_update', { lat, lng, role });
            console.log(`[Socket] Location update for booking ${bookingId} from ${role}`);
        }
    });

    socket.on('ringing', async (data) => {
        const { callId } = data;
        try {
            const call = await CallSession.findById(callId);
            if (call) {
                console.log(`[Call] Notifying customer ${call.customerId} that call is ringing`);
                io.to(call.customerId).emit('ringing', { callId });
            }
        } catch (err) {
            console.error('[Call] Error in ringing event:', err);
        }
    });

    socket.on('call_accepted', async (data) => {
        const { callId } = data;
        const acceptorId = socket.userId;
        console.log(`[Call] ${acceptorId} accepted Call ID: ${callId}`);
        try {
            const call = await CallSession.findByIdAndUpdate(callId, {
                status: 'accepted',
                startTime: new Date()
            }, { new: true });

            if (call) {
                // Notify the OTHER party
                const targetId = (acceptorId === call.customerId) ? call.partnerId : call.customerId;
                console.log(`[Call] Notifying caller ${targetId} that call was accepted`);
                io.to(targetId).emit('call_accepted', { callId });
            } else {
                console.warn(`[Call] Failed to find call session: ${callId}`);
            }
        } catch (err) {
            console.error('[Call] Error in call_accepted:', err);
        }
    });

    socket.on('offer', (data) => {
        console.log(`[RTC] Forwarding offer from ${socket.userId} to ${data.to}`);
        if (data.to) {
            data.from = socket.userId;
            io.to(data.to).emit('offer', data);
        }
    });

    socket.on('answer', (data) => {
        console.log(`[RTC] Forwarding answer from ${socket.userId} to ${data.to}`);
        if (data.to) {
            data.from = socket.userId;
            io.to(data.to).emit('answer', data);
        }
    });

    socket.on('ice_candidate', (data) => {
        console.log(`[RTC] Forwarding ICE candidate from ${socket.userId} to ${data.to}`);
        if (data.to) {
            data.from = socket.userId;
            io.to(data.to).emit('ice_candidate', data);
        }
    });

    socket.on('end_call', async (data) => {
        const { callId } = data;
        const enderId = socket.userId;
        console.log(`[Call] ${enderId} requested to end call: ${callId}`);
        try {
            const call = await CallSession.findById(callId);
            if (call && call.status !== 'completed') {
                const endTime = new Date();
                const startTime = call.startTime || call.createdAt;
                const duration = Math.floor((endTime - startTime) / 1000);

                call.status = 'completed';
                call.endTime = endTime;
                call.duration = duration;
                await call.save();

                console.log(`[Call] Notifying parties of end: ${call.customerId} and ${call.partnerId}`);
                io.to(call.customerId).emit('call_ended', { callId, duration });
                io.to(call.partnerId).emit('call_ended', { callId, duration });
            } else if (call) {
                // If already completed but we got another end_call, just notify again to be safe
                io.to(call.customerId).emit('call_ended', { callId });
                io.to(call.partnerId).emit('call_ended', { callId });
            }
        } catch (err) {
            console.error('[Call] Error in end_call:', err);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        if (socket.userId) {
            // Wait a bit and check if user has other connections
            setTimeout(async () => {
                const activeSockets = await io.in(socket.userId).fetchSockets();
                if (activeSockets.length === 0) {
                    await User.findOneAndUpdate({ uid: socket.userId }, { isOnline: false });
                    io.emit('user_status_change', { uid: socket.userId, isOnline: false });
                    console.log(`[Socket] User ${socket.userId} is now offline`);
                }
            }, 2000);
        }
    });
});

const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        await connectDB();

        server.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

startServer();

// Offers & Coupons
app.get('/api/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/offers/validate', async (req, res) => {
    try {
        const { code, amount } = req.body;
        const offer = await Offer.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });

        if (!offer) {
            return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
        }

        const now = new Date();
        if (offer.expiryDate && now > new Date(offer.expiryDate)) {
            return res.status(400).json({ valid: false, message: 'Coupon has expired' });
        }

        // Calculate discount
        const discountAmount = Math.round((amount * offer.discount) / 100);
        const finalAmount = amount - discountAmount;

        res.json({
            valid: true,
            discount: offer.discount,
            discountAmount,
            finalAmount,
            message: `Coupon applied: ${offer.discount}% off`
        });
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

        const providersWithDetails = await Promise.all(providers.map(async (p) => {
            const providerUser = await User.findOne({ uid: p.uid });
            return {
                ...p.toObject(),
                profileImage: providerUser ? providerUser.profileImage : null,
                totalJobs: providerUser ? providerUser.totalJobs : 0,
                totalEarnings: providerUser ? providerUser.totalEarnings : 0,
                createdAt: providerUser ? providerUser.createdAt : null
            };
        }));

        res.json(providersWithDetails);
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

// Operational Cities Management
app.get('/api/operational-cities', async (req, res) => {
    try {
        const cities = await OperationalCity.find().sort({ name: 1 });
        res.json(cities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/operational-cities', async (req, res) => {
    try {
        const { name } = req.body;
        const newCity = new OperationalCity({ name });
        await newCity.save();

        // Notify interested users
        const interests = await LocationInterest.find({ cityName: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (interests.length > 0) {
            // Collect all unique tokens
            const tokens = [...new Set(interests.map(i => i.fcmToken).filter(t => t))];

            if (tokens.length > 0) {
                const title = 'We are now live!';
                const body = `Madadwala is now available in ${name}. Book your first service now!`;

                // Split tokens into chunks of 500 (FCM limit for multicast)
                for (let i = 0; i < tokens.length; i += 500) {
                    const chunk = tokens.slice(i, i + 500);
                    const message = {
                        notification: { title, body },
                        data: {
                            screen: 'home',
                            city: name,
                            title: title,
                            body: body
                        },
                        tokens: chunk,
                        android: {
                            priority: 'high',
                            notification: {
                                channel_id: 'madadwala_notifications'
                            }
                        }
                    };

                    try {
                        const response = await admin.messaging().sendEachForMulticast(message);
                        console.log(`FCM: Launch notification sent to ${response.successCount} users in ${name}`);
                    } catch (e) {
                        console.error(`FCM: Error in city launch broadcast for ${name}:`, e.message);
                    }
                }
            }

            // Cleanup interests for this city
            await LocationInterest.deleteMany({ cityName: { $regex: new RegExp(`^${name}$`, 'i') } });
        }

        res.status(201).json(newCity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/location-interest', async (req, res) => {
    try {
        const { uid, cityName, fcmToken } = req.body;
        // Check if already registered to avoid duplicates
        const existing = await LocationInterest.findOne({
            $or: [
                { uid, cityName: { $regex: new RegExp(`^${cityName}$`, 'i') } },
                { fcmToken, cityName: { $regex: new RegExp(`^${cityName}$`, 'i') } }
            ]
        });

        if (!existing) {
            const newInterest = new LocationInterest({ uid, cityName, fcmToken });
            await newInterest.save();
        }
        res.json({ message: 'Interest registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/operational-cities/:id', async (req, res) => {
    try {
        await OperationalCity.findByIdAndDelete(req.params.id);
        res.json({ message: 'City removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/bank-details/:uid', async (req, res) => {
    try {
        const { accountNumber, ifscCode, accountHolderName } = req.body;
        await User.findOneAndUpdate(
            { uid: req.params.uid },
            { $set: { bankDetails: { accountNumber, ifscCode, accountHolderName } } },
            { new: true, upsert: true }
        );
        res.json({ message: 'Bank details updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reports
app.post('/api/sos', async (req, res) => {
    try {
        const { uid, name, location, bookingId } = req.body;
        // Notify admin via Socket
        if (io) {
            io.emit('emergency_sos', { uid, name, location, bookingId, timestamp: new Date() });
        }
        // Log activity
        logActivity(uid, 'EMERGENCY_SOS', `User triggered emergency SOS alert`);

        res.json({ message: 'Emergency alert sent to admin' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reports', upload.array('evidence', 5), async (req, res) => {
    try {
        const { reporterUid, reportedUid, reason, description } = req.body;
        const evidenceUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileName = `reports/${Date.now()}_${file.originalname}`;
                await s3.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME,
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }));
                evidenceUrls.push(`${process.env.R2_PUBLIC_URL}/${fileName}`);
            }
        }

        const newReport = new Report({
            reporterUid,
            reportedUid,
            reason,
            description,
            evidenceUrls
        });
        await newReport.save();

        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Report submission error:', error);
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

// Admin: Get all customers
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
        console.log(`Admin API: Found ${users.length} customers`);
        res.json(users);
    } catch (error) {
        console.error('Admin API Error (users):', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all providers
app.get('/api/admin/providers-all', async (req, res) => {
    try {
        const providers = await User.find({ role: 'provider' }).sort({ createdAt: -1 });
        console.log(`Admin API: Found ${providers.length} providers`);
        res.json(providers);
    } catch (error) {
        console.error('Admin API Error (providers):', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all bookings
app.get('/api/admin/all-bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Toggle block status
app.patch('/api/admin/users/:uid/toggle-block', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid });
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all reports
app.get('/api/admin/reports', async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update report status
app.patch('/api/admin/reports/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json({ message: 'Report status updated', report });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all transactions (Global)
app.get('/api/admin/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Send Notification/Warning to specific user
app.post('/api/admin/send-notification', async (req, res) => {
    try {
        const { uid, title, message, type } = req.body;

        await sendFCMNotification(uid, title, message, {
            type: type || 'admin_notification',
            screen: 'notifications'
        });

        // Also log in activity log
        await logActivity(uid, 'ADMIN_NOTIFICATION', `${title}: ${message}`);

        res.json({ message: 'Notification sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete user
app.delete('/api/admin/users/:uid', async (req, res) => {
    try {
        await User.findOneAndDelete({ uid: req.params.uid });
        await Provider.findOneAndDelete({ uid: req.params.uid });
        res.json({ message: 'User deleted permanently' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update Wallet Balance
app.post('/api/admin/wallet/adjust', async (req, res) => {
    try {
        const { uid, amount, type, description } = req.body;
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (type === 'credit') {
            user.walletBalance += Number(amount);
        } else {
            user.walletBalance -= Number(amount);
        }
        await user.save();

        const transaction = new Transaction({
            userUid: uid,
            type,
            amount: Number(amount),
            title: 'Admin Adjustment',
            description: description || 'Balance adjusted by administrator'
        });
        await transaction.save();

        res.json({ message: 'Wallet balance adjusted', newBalance: user.walletBalance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all reviews
app.get('/api/admin/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Delete review
app.delete('/api/admin/reviews/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Broadcast Notification to all users or specific roles
app.post('/api/admin/broadcast', async (req, res) => {
    try {
        const { role, title, message } = req.body;
        let query = {};
        if (role && role !== 'all') query.role = role;

        const users = await User.find(query);
        const uids = users.map(u => u.uid);

        if (uids.length > 0) {
            await broadcastFCMNotification(uids, title, message, {
                type: 'broadcast',
                screen: 'notifications'
            });

            // Log for each user (optional, can be heavy if thousands of users)
            // For now, just log success
            console.log(`Broadcast: Sent to ${uids.length} users (${role || 'all'})`);
        }

        res.json({ message: `Broadcast sent to ${uids.length} users` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Operations Monitor (Live status of all partners)
app.get('/api/admin/operations-monitor', async (req, res) => {
    try {
        const providers = await Provider.find();
        const activeBookings = await Booking.find({
            status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress'] }
        });

        const monitorData = await Promise.all(providers.map(async (p) => {
            const user = await User.findOne({ uid: p.uid });
            const currentBooking = activeBookings.find(b => b.providerUid === p.uid);

            return {
                uid: p.uid,
                name: p.name,
                profileImage: user?.profileImage,
                phoneNumber: user?.phoneNumber,
                isVerified: p.isVerified,
                status: p.isAvailable ? (currentBooking ? 'busy' : 'online') : 'offline',
                currentTask: currentBooking ? {
                    service: currentBooking.serviceName,
                    status: currentBooking.status,
                    customer: currentBooking.customerName,
                    bookingId: currentBooking._id
                } : null,
                lat: p.lat,
                lng: p.lng,
                lastUpdated: user?.updatedAt || new Date()
            };
        }));

        res.json(monitorData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;




