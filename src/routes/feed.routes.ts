// posts-api/src/routes/feed.routes.ts
import { Router } from "express";
import { FeedController } from "../controllers/feed.controller";
import { extractUserFromJWT, optionalAuth } from "../middleware/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Personalized and public feed endpoints
 */
const router = Router();
const controller = new FeedController();

/**
 * @swagger
 * /api/feed/personalized:
 *   get:
 *     summary: Get personalized feed for authenticated user
 *     description: Returns posts from followed users first, then other posts
 *     tags: [Feed]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of posts to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Pagination cursor (ISO date string from previous response)
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [image, video, all]
 *         description: Filter by media type
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *     responses:
 *       200:
 *         description: Personalized feed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                 hasMore:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/personalized", extractUserFromJWT, controller.getPersonalizedFeed);

/**
 * @swagger
 * /api/feed/public:
 *   get:
 *     summary: Get public feed (no authentication required)
 *     description: Returns recent posts from all users
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [image, video, all]
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public feed
 */
router.get("/public", controller.getPublicFeed);

/**
 * @swagger
 * /api/feed/trending:
 *   get:
 *     summary: Get trending posts based on engagement
 *     tags: [Feed]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Days to look back for trending posts
 *     responses:
 *       200:
 *         description: Trending posts
 */
router.get("/trending", controller.getTrendingFeed);

/**
 * @swagger
 * /api/feed/discover:
 *   get:
 *     summary: Get discover feed (posts from users you don't follow)
 *     tags: [Feed]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Discover feed
 *       401:
 *         description: Unauthorized
 */
router.get("/discover", extractUserFromJWT, controller.getDiscoverFeed);

export default router;