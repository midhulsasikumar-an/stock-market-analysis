require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const DEMO_PASSWORD = "DemoUser@2026";

// DEV NOTE: Replace seed data with real user data before production launch
// Never commit real user emails or personal data to this repository
const DEMO_USERS = [
    { firstName: "Arjun", lastName: "Mehta", username: "arjun_mehta", email: "arjun.mehta@example.com", accountStatus: "active" },
    { firstName: "Priya", lastName: "Nair", username: "priya_nair", email: "priya.nair@example.com", accountStatus: "active" },
    { firstName: "Carlos", lastName: "Rivera", username: "c_rivera", email: "c.rivera@example.com", accountStatus: "active" },
    { firstName: "Sarah", lastName: "Chen", username: "sarah_chen", email: "sarah.chen@example.com", accountStatus: "suspended" },
    { firstName: "David", lastName: "Okonkwo", username: "d_okonkwo", email: "d.okonkwo@example.com", accountStatus: "active" },
    { firstName: "Emily", lastName: "Watson", username: "emily_watson", email: "emily.watson@example.com", accountStatus: "active" },
    { firstName: "Midhul", lastName: "Sasikumar", username: "midhul_sasikumar", email: "midhul@example.com", accountStatus: "active" }
];

const TEST_USERNAME_PATTERNS = [/^cors_check_/i, /^codex_test_user_/i];

function shouldReplaceTestUser(user) {
    const username = String(user.username || "");
    return TEST_USERNAME_PATTERNS.some((pattern) => pattern.test(username));
}

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/stock-market-analysis";
    await mongoose.connect(uri);
    console.log("Connected to DB");

    try {
        const candidateUsers = await User.find({ role: { $ne: "admin" } })
            .select("_id username email")
            .lean();

        const testUsers = candidateUsers.filter(shouldReplaceTestUser);
        if (testUsers.length > 0) {
            const testUserIds = testUsers.map((user) => user._id);
            const deleteResult = await User.deleteMany({ _id: { $in: testUserIds } });
            console.log(`Removed ${deleteResult.deletedCount} test/demo users with machine-style usernames.`);
        } else {
            console.log("No machine-style test/demo users found.");
        }

        let created = 0;
        let updated = 0;

        for (const userData of DEMO_USERS) {
            const existing = await User.findOne({ email: userData.email });

            if (!existing) {
                const user = new User({
                    ...userData,
                    password: DEMO_PASSWORD,
                    role: "user",
                    registrationSource: "email",
                    emailVerified: true
                });
                await user.save();
                created += 1;
                continue;
            }

            if (existing.role === "admin") {
                continue;
            }

            existing.firstName = userData.firstName;
            existing.lastName = userData.lastName;
            existing.username = userData.username;
            existing.accountStatus = userData.accountStatus;
            existing.registrationSource = existing.registrationSource || "email";
            existing.emailVerified = true;
            await existing.save();
            updated += 1;
        }

        console.log(`Demo seed complete. Created: ${created}, Updated: ${updated}`);
        console.log("Master admin account was preserved as-is.");
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from DB");
    }
}

run().catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
});
