import express from "express";
import {
  getTopSolvers,
  getExploreTopics,
  getFeaturedProblems,
  byTheNumbers,
  getDiscussOverview,
  getContestsOverview,
  getProblemsOverview
} from "../controllers/public.js";

const router = express.Router();

router.get("/top-solvers", getTopSolvers);
router.get("/explore-topics", getExploreTopics);
router.get("/featured-problems", getFeaturedProblems);
router.get("/by-the-numbers", byTheNumbers);
router.get("/discuss-overview", getDiscussOverview);
router.get("/contests-overview", getContestsOverview);
router.get("/problems-overview", getProblemsOverview);

export default router;
