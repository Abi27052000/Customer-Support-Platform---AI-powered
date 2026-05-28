import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists:', adminExists.email);
            process.exit();
        }

        // Create New Admin Configuration
        const email = 'admin@support.com';
        const password = 'AdminPassword123';
        const name = 'Platform Admin';

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            name: name,
            email: email,
            password: hashedPassword,
            role: 'admin'
        });

        await newAdmin.save();
        console.log('\n-----------------------------------------');
        console.log('✅ MAIN ADMIN CREATED SUCCESSFULLY');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('-----------------------------------------');
        console.log('You can now log in at /login\n');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
