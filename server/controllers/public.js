import Auth from "../models/auth.js";
import Problem from "../models/problem.js";
import Contest from "../models/contest.js";
import Submission from "../models/Submission.js";
import ContestParticipation from "../models/ContestParticipation.js";

// 1) Top Solvers
export const getTopSolvers = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);

    const users = await Auth.find({
      isBanned: { $ne: true },
    })
      .select("name username profilePicture stats rating rank")
      .sort({ "stats.solved": -1, rating: -1, rank: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    const solvers = users.map((u) => {
      const solved = u?.stats?.solved || 0;
      const attempted = u?.stats?.attempted || 0;
      const acceptanceRate = attempted > 0 ? Number(((solved / attempted) * 100).toFixed(2)) : 0;

      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        profilePicture: u.profilePicture || "",
        solved,
        attempted,
        acceptanceRate,
        rating: u.rating || 0,
        rank: u.rank || 0,
      };
    });

    res.status(200).json({
      success: true,
      solvers,
    });
  } catch (error) {
    console.error("Get top solvers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top solvers",
      error: error.message,
    });
  }
};

// 2) Explore Topics
export const getExploreTopics = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

    const topics = await Problem.aggregate([
      {
        $match: {
          isPublished: true,
          isActive: true,
        },
      },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          problemCount: { $sum: 1 },
          totalSubmissions: { $sum: "$totalSubmissions" },
          totalAccepted: { $sum: "$totalAccepted" },
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id",
          problemCount: 1,
          totalSubmissions: 1,
          totalAccepted: 1,
          acceptanceRate: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              { $multiply: [{ $divide: ["$totalAccepted", "$totalSubmissions"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { problemCount: -1, totalSubmissions: -1, topic: 1 } },
      { $limit: limit },
    ]);

    const normalizedTopics = topics.map((t) => ({
      ...t,
      acceptanceRate: Number((t.acceptanceRate || 0).toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      topics: normalizedTopics,
    });
  } catch (error) {
    console.error("Get explore topics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching topics",
      error: error.message,
    });
  }
};

// 3) Featured Problems
export const getFeaturedProblems = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);
    const difficulty = req.query.difficulty;

    const filter = {
      isPublished: true,
      isActive: true,
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const problems = await Problem.find(filter)
      .select("title slug difficulty tags acceptanceRate totalSubmissions totalAccepted isPremium problemNumber")
      .sort({ totalSubmissions: -1, acceptanceRate: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    const featuredProblems = problems.map((p) => ({
      ...p,
      acceptanceRate: Number((p.acceptanceRate || 0).toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      featuredProblems,
    });
  } catch (error) {
    console.error("Get featured problems error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured problems",
      error: error.message,
    });
  }
};

export const byTheNumbers = async (req, res) => {
  try {
    const totalProblems = await Problem.countDocuments({ isPublished: true, isActive: true });
    const totalSubmissionsAgg = await Problem.aggregate([
      { $match: { isPublished: true, isActive: true } },
      { $group: { _id: null, totalSubmissions: { $sum: "$totalSubmissions" }, totalAccepted: { $sum: "$totalAccepted" } } },
    ]);

    const totalSubmissions = totalSubmissionsAgg[0]?.totalSubmissions || 0;
    const totalAccepted = totalSubmissionsAgg[0]?.totalAccepted || 0;
    const overallAcceptanceRate = totalSubmissions > 0 ? Number(((totalAccepted / totalSubmissions) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalProblems,
        totalSubmissions,
        totalAccepted,
        overallAcceptanceRate,
      },
    });
  } catch (error) {
    console.error("By the numbers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
}

export const getDiscussOverview = async (req, res) => {
  try {
    const [totalProblems, totalContests, totalSubmissions, activeUsersAgg] = await Promise.all([
      Problem.countDocuments({ isPublished: true, isActive: true }),
      Contest.countDocuments({ isPublished: true, isActive: true }),
      Submission.countDocuments(),
      Submission.aggregate([
        { $match: { submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: "$userId" } },
        { $count: "count" },
      ]),
    ]);

    const trendingTags = await Problem.aggregate([
      { $match: { isPublished: true, isActive: true, tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          problemCount: { $sum: 1 },
          totalSubmissions: { $sum: "$totalSubmissions" },
          totalAccepted: { $sum: "$totalAccepted" },
        },
      },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          problemCount: 1,
          totalSubmissions: 1,
          totalAccepted: 1,
          acceptanceRate: {
            $cond: [
              { $gt: ["$totalSubmissions", 0] },
              { $multiply: [{ $divide: ["$totalAccepted", "$totalSubmissions"] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { totalSubmissions: -1, problemCount: -1, tag: 1 } },
      { $limit: 8 },
    ]);

    const now = new Date();
    const contests = await Contest.find({
      isPublished: true,
      isActive: true,
      endTime: { $gte: now },
    })
      .select("title slug startTime endTime problems")
      .sort({ startTime: 1 })
      .limit(6)
      .lean();

    const contestList = contests.map((contest) => {
      let status = "upcoming";
      if (now >= contest.startTime && now <= contest.endTime) status = "running";

      return {
        title: contest.title,
        slug: contest.slug,
        startTime: contest.startTime,
        endTime: contest.endTime,
        status,
        problemCount: contest.problems?.length || 0,
      };
    });

    const recentSubmissionsRaw = await Submission.find({})
      .select("submittedAt verdict language runtime userId problemId")
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate("userId", "name username profilePicture")
      .populate("problemId", "title slug difficulty")
      .lean();

    const recentSubmissions = recentSubmissionsRaw
      .filter((item) => item?.userId && item?.problemId)
      .map((item) => ({
        _id: item._id,
        submittedAt: item.submittedAt,
        verdict: item.verdict,
        language: item.language,
        runtime: item.runtime || 0,
        user: {
          name: item.userId.name || "",
          username: item.userId.username || "",
          profilePicture: item.userId.profilePicture || "",
        },
        problem: {
          title: item.problemId.title,
          slug: item.problemId.slug,
          difficulty: item.problemId.difficulty,
        },
      }));

    const topContributors = await Auth.find({ isBanned: { $ne: true } })
      .select("name username profilePicture stats rating")
      .sort({ "stats.solved": -1, rating: -1 })
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProblems,
          totalContests,
          totalSubmissions,
          activeUsers7d: activeUsersAgg[0]?.count || 0,
        },
        trendingTags: trendingTags.map((tag) => ({
          ...tag,
          acceptanceRate: Number((tag.acceptanceRate || 0).toFixed(2)),
        })),
        activeContests: contestList,
        recentSubmissions,
        topContributors: topContributors.map((user) => ({
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture || "",
          solved: user?.stats?.solved || 0,
          attempted: user?.stats?.attempted || 0,
          rating: user.rating || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Discuss overview error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching discuss overview",
      error: error.message,
    });
  }
};

export const getContestsOverview = async (req, res) => {
  try {
    const now = new Date();

    const [totalContests, runningContestsCount, upcomingContestsCount, totalParticipantsAgg] = await Promise.all([
      Contest.countDocuments({ isPublished: true, isActive: true }),
      Contest.countDocuments({ isPublished: true, isActive: true, startTime: { $lte: now }, endTime: { $gte: now } }),
      Contest.countDocuments({ isPublished: true, isActive: true, startTime: { $gt: now } }),
      ContestParticipation.aggregate([{ $group: { _id: null, total: { $sum: 1 } } }]),
    ]);

    const pastContestsCount = Math.max(totalContests - runningContestsCount - upcomingContestsCount, 0);

    const [runningContests, upcomingContests, recentPastContests] = await Promise.all([
      Contest.find({
        isPublished: true,
        isActive: true,
        startTime: { $lte: now },
        endTime: { $gte: now },
      })
        .select("title slug description startTime endTime problems")
        .sort({ endTime: 1 })
        .limit(6)
        .lean(),
      Contest.find({
        isPublished: true,
        isActive: true,
        startTime: { $gt: now },
      })
        .select("title slug description startTime endTime problems")
        .sort({ startTime: 1 })
        .limit(6)
        .lean(),
      Contest.find({
        isPublished: true,
        isActive: true,
        endTime: { $lt: now },
      })
        .select("title slug description startTime endTime problems")
        .sort({ endTime: -1 })
        .limit(8)
        .lean(),
    ]);

    const activeContestIds = [...runningContests, ...upcomingContests].map((contest) => contest._id);
    const participationRows = activeContestIds.length
      ? await ContestParticipation.aggregate([
          { $match: { contestId: { $in: activeContestIds } } },
          { $group: { _id: "$contestId", participants: { $sum: 1 } } },
        ])
      : [];

    const participantsMap = new Map(participationRows.map((item) => [String(item._id), item.participants]));

    const toContestCard = (contest, status) => ({
      _id: contest._id,
      title: contest.title,
      slug: contest.slug,
      description: contest.description || "",
      startTime: contest.startTime,
      endTime: contest.endTime,
      status,
      problemCount: contest.problems?.length || 0,
      participants: participantsMap.get(String(contest._id)) || 0,
    });

    const topPerformersAgg = await Submission.aggregate([
      { $match: { contestId: { $ne: null }, verdict: "Accepted" } },
      {
        $group: {
          _id: { userId: "$userId", contestId: "$contestId", problemId: "$problemId" },
          firstAcceptedAt: { $min: "$submittedAt" },
        },
      },
      {
        $group: {
          _id: { userId: "$_id.userId", contestId: "$_id.contestId" },
          solved: { $sum: 1 },
          lastAcceptedAt: { $max: "$firstAcceptedAt" },
        },
      },
      { $sort: { solved: -1, lastAcceptedAt: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "auths",
          localField: "_id.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "contests",
          localField: "_id.contestId",
          foreignField: "_id",
          as: "contest",
        },
      },
      { $unwind: "$contest" },
      {
        $project: {
          _id: 0,
          solved: 1,
          lastAcceptedAt: 1,
          user: {
            _id: "$user._id",
            name: "$user.name",
            username: "$user.username",
            profilePicture: "$user.profilePicture",
          },
          contest: {
            _id: "$contest._id",
            title: "$contest.title",
            slug: "$contest.slug",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalContests,
          runningContests: runningContestsCount,
          upcomingContests: upcomingContestsCount,
          pastContests: pastContestsCount,
          totalParticipants: totalParticipantsAgg[0]?.total || 0,
        },
        running: runningContests.map((contest) => toContestCard(contest, "running")),
        upcoming: upcomingContests.map((contest) => toContestCard(contest, "upcoming")),
        recentPast: recentPastContests.map((contest) => toContestCard(contest, "past")),
        topPerformers: topPerformersAgg,
      },
    });
  } catch (error) {
    console.error("Contests overview error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contests overview",
      error: error.message,
    });
  }
};

export const getProblemsOverview = async (req, res) => {
  try {
    const [totalProblems, byDifficultyAgg, totalsAgg, premiumCount] = await Promise.all([
      Problem.countDocuments({ isPublished: true, isActive: true }),
      Problem.aggregate([
        { $match: { isPublished: true, isActive: true } },
        { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      ]),
      Problem.aggregate([
        { $match: { isPublished: true, isActive: true } },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: "$totalSubmissions" },
            totalAccepted: { $sum: "$totalAccepted" },
          },
        },
      ]),
      Problem.countDocuments({ isPublished: true, isActive: true, isPremium: true }),
    ]);

    const difficultyMap = { Easy: 0, Medium: 0, Hard: 0 };
    for (const row of byDifficultyAgg) {
      if (row?._id && difficultyMap[row._id] !== undefined) {
        difficultyMap[row._id] = row.count || 0;
      }
    }

    const totalSubmissions = totalsAgg[0]?.totalSubmissions || 0;
    const totalAccepted = totalsAgg[0]?.totalAccepted || 0;
    const overallAcceptanceRate =
      totalSubmissions > 0 ? Number(((totalAccepted / totalSubmissions) * 100).toFixed(2)) : 0;

    const [trendingTags, popularProblems, newestProblems, topSolvers] = await Promise.all([
      Problem.aggregate([
        { $match: { isPublished: true, isActive: true, tags: { $exists: true, $ne: [] } } },
        { $unwind: "$tags" },
        {
          $group: {
            _id: "$tags",
            problemCount: { $sum: 1 },
            totalSubmissions: { $sum: "$totalSubmissions" },
            totalAccepted: { $sum: "$totalAccepted" },
          },
        },
        {
          $project: {
            _id: 0,
            tag: "$_id",
            problemCount: 1,
            totalSubmissions: 1,
            acceptanceRate: {
              $cond: [
                { $gt: ["$totalSubmissions", 0] },
                { $multiply: [{ $divide: ["$totalAccepted", "$totalSubmissions"] }, 100] },
                0,
              ],
            },
          },
        },
        { $sort: { totalSubmissions: -1, problemCount: -1, tag: 1 } },
        { $limit: 10 },
      ]),
      Problem.find({ isPublished: true, isActive: true })
        .select("title slug difficulty tags totalSubmissions totalAccepted acceptanceRate")
        .sort({ totalSubmissions: -1, acceptanceRate: 1 })
        .limit(10)
        .lean(),
      Problem.find({ isPublished: true, isActive: true })
        .select("title slug difficulty tags createdAt acceptanceRate")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Auth.find({ isBanned: { $ne: true } })
        .select("name username profilePicture stats rating")
        .sort({ "stats.solved": -1, rating: -1 })
        .limit(8)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProblems,
          easy: difficultyMap.Easy,
          medium: difficultyMap.Medium,
          hard: difficultyMap.Hard,
          premium: premiumCount,
          totalSubmissions,
          totalAccepted,
          overallAcceptanceRate,
        },
        trendingTags: trendingTags.map((item) => ({
          ...item,
          acceptanceRate: Number((item.acceptanceRate || 0).toFixed(2)),
        })),
        popularProblems: popularProblems.map((problem) => ({
          ...problem,
          acceptanceRate: Number((problem.acceptanceRate || 0).toFixed(2)),
        })),
        newestProblems: newestProblems.map((problem) => ({
          ...problem,
          acceptanceRate: Number((problem.acceptanceRate || 0).toFixed(2)),
        })),
        topSolvers: topSolvers.map((user) => ({
          _id: user._id,
          name: user.name || "",
          username: user.username || "",
          profilePicture: user.profilePicture || "",
          solved: user?.stats?.solved || 0,
          attempted: user?.stats?.attempted || 0,
          rating: user.rating || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Problems overview error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching problems overview",
      error: error.message,
    });
  }
};
