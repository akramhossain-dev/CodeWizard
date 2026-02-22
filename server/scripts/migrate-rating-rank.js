import dotenv from "dotenv";
dotenv.config();

import connectDB from "../libs/db.js";
import Auth from "../models/auth.js";
import { recomputeAllRanks } from "../libs/ranking.js";

async function migrate() {
  await connectDB();

  // Backfill old default rating (5000) users who never solved anything.
  const backfill = await Auth.updateMany(
    {
      rating: 5000,
      "stats.solved": { $lte: 0 },
    },
    { $set: { rating: 0 } }
  );

  // Ensure missing rank field is initialized.
  await Auth.updateMany(
    { rank: { $exists: false } },
    { $set: { rank: 0 } }
  );

  await recomputeAllRanks();

  console.log(`Rating backfilled: ${backfill.modifiedCount}`);
  console.log("Rank recompute completed.");
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
