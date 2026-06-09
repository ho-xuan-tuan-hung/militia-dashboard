const mongoose = require("mongoose");
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");
const readline = require("readline");

const scryptAsync = promisify(scrypt);

require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    hoTen: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "tieu_doi_truong"],
      required: true,
    },
    tieuDoi: { type: Number },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log("🔧 Creating Admin User\n");

    if (!process.env.MONGODB_URI) {
      console.error(
        "❌ MONGODB_URI not found in .env.local. Please set it up first."
      );
      process.exit(1);
    }

    // Prompt for admin details
    const username = await prompt("👤 Username (default: admin): ");
    const password = await prompt("🔐 Password: ");
    const hoTen = await prompt("📝 Full Name (Họ tên): ");

    if (!username || !password || !hoTen) {
      console.error("❌ All fields are required!");
      process.exit(1);
    }

    // Connect to MongoDB
    console.log("\n📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if user exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      console.error(
        `❌ User "${username}" already exists. Please use a different username.`
      );
      process.exit(1);
    }

    // Hash password
    console.log("🔒 Hashing password...");
    const passwordHash = await hashPassword(password);

    // Create admin user
    const adminUser = await User.create({
      username: username.toLowerCase().trim(),
      passwordHash,
      hoTen,
      role: "admin",
      active: true,
    });

    console.log("\n✅ Admin user created successfully!\n");
    console.log("📋 Admin Details:");
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Full Name: ${adminUser.hoTen}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.active}`);
    console.log("\n💡 Next steps:");
    console.log("   1. Remove ADMIN_USERNAME and ADMIN_PASSWORD from Vercel env vars");
    console.log("   2. Keep only NEXTAUTH_SECRET");
    console.log("   3. Deploy to Vercel\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
