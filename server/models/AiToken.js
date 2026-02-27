import mongoose from "mongoose";

const aiTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
      unique: true,
      index: true,
    },

    // Token balance
    balance: { type: Number, default: 0 },

    // Lifetime stats
    totalEarned: { type: Number, default: 0 },
    totalUsed: { type: Number, default: 0 },

    // Daily free grant tracking
    lastDailyGrant: { type: Date, default: null },

    // Usage history (last 100 entries)
    usageHistory: [
      {
        tokensUsed: { type: Number, required: true },
        description: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Grant history (last 50 entries)
    grantHistory: [
      {
        type: {
          type: String,
          enum: ["daily", "bonus", "admin", "signup"],
          required: true,
        },
        amount: { type: Number, required: true },
        description: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ── Check if daily grant available (24hr rolling window) ─────────────────────
aiTokenSchema.methods.canClaimDaily = function () {
  if (!this.lastDailyGrant) return true;
  const ms24h = 24 * 60 * 60 * 1000;
  return Date.now() - new Date(this.lastDailyGrant).getTime() >= ms24h;
};

// ── Time remaining until next daily claim (ms) ──────────────────────────────
aiTokenSchema.methods.nextClaimIn = function () {
  if (!this.lastDailyGrant) return 0;
  const ms24h = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(this.lastDailyGrant).getTime();
  return Math.max(0, ms24h - elapsed);
};

// ── Grant daily tokens ───────────────────────────────────────────────────────
aiTokenSchema.methods.claimDailyTokens = function (amount = 50) {
  if (!this.canClaimDaily()) return false;
  this.balance += amount;
  this.totalEarned += amount;
  this.lastDailyGrant = new Date();
  this.grantHistory.push({ type: "daily", amount, description: "Daily free tokens" });
  if (this.grantHistory.length > 50) this.grantHistory = this.grantHistory.slice(-50);
  return true;
};

// ── Deduct tokens ────────────────────────────────────────────────────────────
aiTokenSchema.methods.useTokens = function (amount, description = "") {
  if (this.balance < amount) return false;
  this.balance -= amount;
  this.totalUsed += amount;
  this.usageHistory.push({ tokensUsed: amount, description });
  if (this.usageHistory.length > 100) this.usageHistory = this.usageHistory.slice(-100);
  return true;
};

const AiToken = mongoose.model("AiToken", aiTokenSchema);

export default AiToken;
