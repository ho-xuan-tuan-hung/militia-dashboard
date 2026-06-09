const mongoose = require("mongoose");
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    hoTen: { type: String, required: true },
    role: { type: String, enum: ["admin", "tieu_doi_truong", "dan_quan"], required: true },
    tieuDoi: { type: Number },
    militiaId: { type: mongoose.Schema.Types.ObjectId, ref: "Militia" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const MilitiaSchema = new mongoose.Schema({
  hoTen: String,
  cccd: String,
  tieuDoi: Number,
  chucVu: String,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Militia = mongoose.models.Militia || mongoose.model("Militia", MilitiaSchema);

function toSlug(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  try {
    console.log("🌱 Seeding Users from Militia Data\n");

    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env.local");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // ── Delete all non-admin users to re-seed cleanly ──
    const deleted = await User.deleteMany({ role: { $in: ["tieu_doi_truong", "dan_quan"] } });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️  Cleared ${deleted.deletedCount} existing non-admin users\n`);
    }

    // ── 1. Tạo 3 accounts Tiểu đội trưởng ──
    console.log("👥 Creating Tiểu đội trưởng accounts...");
    const tieuDoiPasswordHash = await hashPassword("A@123123123");

    for (const tieuDoi of [1, 2, 3]) {
      const username = `tieu-doi-truong-a${tieuDoi}`;
      await User.create({
        username,
        passwordHash: tieuDoiPasswordHash,
        hoTen: `Tiểu đội trưởng ${tieuDoi}`,
        role: "tieu_doi_truong",
        tieuDoi,
        active: true,
      });
      console.log(`  ✅ ${username} (Tiểu đội ${tieuDoi}) — password: A@123123123`);
    }

    // ── 2. Tạo accounts Dân quân cho tất cả militia ──
    console.log("\n👥 Creating Dân quân accounts...");
    const militiaList = await Militia.find({ tieuDoi: { $in: [1, 2, 3] } });

    if (militiaList.length === 0) {
      console.error("❌ No militia found with tieuDoi 1, 2, or 3");
      process.exit(1);
    }

    const danQuanPasswordHash = await hashPassword("123123123");
    let created = 0;
    const createdUsers = [];

    for (const militia of militiaList) {
      try {
        const nameSlug = toSlug(militia.hoTen);
        const username = `${nameSlug}-a${militia.tieuDoi}`;

        await User.create({
          username,
          passwordHash: danQuanPasswordHash,
          hoTen: militia.hoTen,
          role: "dan_quan",
          tieuDoi: militia.tieuDoi,
          militiaId: militia._id,
          active: true,
        });

        created++;
        createdUsers.push({ username, hoTen: militia.hoTen, tieuDoi: militia.tieuDoi });
        console.log(`  ✅ ${username} (${militia.hoTen}, Tiểu đội ${militia.tieuDoi})`);
      } catch (error) {
        console.error(`  ❌ Error for "${militia.hoTen}": ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log(`   👑 Tiểu đội trưởng: 3 accounts (tieu-doi-truong-a1/a2/a3)`);
    console.log(`   👤 Dân quân: ${created} accounts`);
    console.log("=".repeat(60));

    console.log("\n📋 Dân quân accounts:");
    console.table(createdUsers);

    console.log("\n🔐 Passwords:");
    console.log("   Tiểu đội trưởng: A@123123123");
    console.log("   Dân quân:        123123123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
