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
    aadhaarNumber: String,
    verificationDate: String,
    walletBalance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    favorites: [{ type: String }], // Array of provider UIDs
    addresses: [{
        label: String, // 'Home', 'Work', etc.
        fullAddress: String,
        lat: Number,
        lng: Number
    }],
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
    isAvailable: { type: Boolean, default: true },
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
    rejectedBy: [String], // Array of provider UIDs who rejected this request
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
        const { uid, phoneNumber, role, name, email, category, profession, aadhaarNumber } = req.body;

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
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const newBooking = new Booking({ ...req.body, otp });
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
            address: "Customer Location",
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
        const bookings = await Booking.find({ customerUid: req.params.uid }).sort({ createdAt: -1 });

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
        const requests = await CustomRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
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
            address: "Customer Location", // In real app, get from customer
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
            address: "Customer Location",
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

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

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

module.exports = app;
