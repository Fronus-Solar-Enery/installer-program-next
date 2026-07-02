const crypto = require("crypto");

const secret = crypto.randomBytes(32).toString("base64");

console.log("Generated NEXTAUTH_SECRET:\n");
console.log(secret);
console.log("\nAdd this to .env.local:");
console.log(`NEXTAUTH_SECRET=${secret}`);
