/**
 * One-time setup script:
 * 1. Fix null usernames in existing user records
 * 2. Sync all Mongoose indexes
 * 3. Verify all collections exist
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/stock-market-analysis");
    console.log("Connected to DB");

    const db = mongoose.connection.db;

    // ── Fix null usernames ──────────────────────────────────────
    const users = db.collection("users");
    const nullUsers = await users.find({ username: null }).toArray();
    console.log(`\nUsers with null username: ${nullUsers.length}`);

    for (const u of nullUsers) {
        const base = (u.email || "user").split("@")[0].replace(/[^a-z0-9_]/gi, "_").substring(0, 15);
        const uname = (base + "_" + u._id.toString().slice(-4)).toLowerCase();
        await users.updateOne({ _id: u._id }, { $set: { username: uname } });
        console.log(`  Fixed: ${u.email} -> ${uname}`);
    }

    // ── Sync indexes for all models ─────────────────────────────
    console.log("\nSyncing indexes...");
    const models = [
        require("./models/User"),
        require("./models/WatchlistUser"),
        require("./models/Portfolio"),
        require("./models/Alert"),
        require("./models/SearchHistory"),
        require("./models/UserSettings"),
        require("./models/Transaction"),
        require("./models/StockCache"),
        require("./models/PriceCache"),
        require("./models/AdminAnnouncement"),
        require("./models/ServerMeta"),
    ];

    for (const M of models) {
        try {
            await M.syncIndexes();
            console.log(`  ✅ ${M.collection.name}`);
        } catch (e) {
            console.log(`  ⚠️ ${M.collection.name}: ${e.message.substring(0, 100)}`);
        }
    }

    // ── List all collections ────────────────────────────────────
    const cols = await db.listCollections().toArray();
    console.log(`\nAll ${cols.length} collections:`);
    cols.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => console.log(`  ✅ ${c.name}`));

    await mongoose.disconnect();
    console.log("\nDone!");
}

run().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
