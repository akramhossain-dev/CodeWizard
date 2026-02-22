import Auth from "../models/auth.js";

export const DEFAULT_RATING = 0;

export const RATING_DELTA = {
  Easy: 5,
  Medium: 10,
  Hard: 20,
};

export const getRatingDelta = (difficulty) => RATING_DELTA[difficulty] || 0;

const isRankedUser = (user) => {
  const solved = user?.stats?.solved || 0;
  const rating = user?.rating ?? DEFAULT_RATING;
  return solved > 0 || rating > DEFAULT_RATING;
};

export const recomputeAllRanks = async () => {
  const users = await Auth.find({}, "_id rating stats.solved")
    .sort({ rating: -1, "stats.solved": -1, _id: 1 })
    .lean();

  const bulkOps = [];
  let rankCounter = 0;

  for (const user of users) {
    const nextRank = isRankedUser(user) ? ++rankCounter : 0;
    bulkOps.push({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { rank: nextRank } },
      },
    });
  }

  if (bulkOps.length > 0) {
    await Auth.bulkWrite(bulkOps, { ordered: false });
  }
};
