// posts-api/src/controllers/feed.controller.ts
import { Response } from "express";
import { FeedService } from "../services/feed.service";
import { AuthRequest } from "../middleware/auth.middleware";

const feedService = new FeedService();

export class FeedController {
  /**
   * GET /api/feed/personalized
   * Get personalized feed for authenticated user
   * Query params:
   * - limit: number of posts (default 10, max 50)
   * - cursor: pagination cursor (ISO date string)
   * - mediaType: filter by media type (image/video/all)
   * - tags: comma-separated tags
   */
  async getPersonalizedFeed(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const cursor = req.query.cursor as string;
      const mediaType = req.query.mediaType as "image" | "video" | "all" | undefined;
      const tags = req.query.tags
        ? (req.query.tags as string).split(",").map((t) => t.trim())
        : undefined;
      const authCookie = req.cookies?.auth_token;

      const filters = {
        mediaType,
        tags,
      };

      const feed = await feedService.getPersonalizedFeed(
        req.user.id,
        limit,
        cursor,
        filters,
        authCookie
      );

      res.json(feed);
    } catch (error) {
      console.error("Error fetching personalized feed:", error);
      res.status(500).json({ 
        message: "Error fetching personalized feed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/feed/public
   * Get public feed (no authentication required)
   * Query params:
   * - limit: number of posts (default 10, max 50)
   * - cursor: pagination cursor (ISO date string)
   * - mediaType: filter by media type (image/video/all)
   * - tags: comma-separated tags
   */
  async getPublicFeed(req: AuthRequest, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const cursor = req.query.cursor as string;
      const mediaType = req.query.mediaType as "image" | "video" | "all" | undefined;
      const tags = req.query.tags
        ? (req.query.tags as string).split(",").map((t) => t.trim())
        : undefined;

      const filters = {
        mediaType,
        tags,
      };

      const feed = await feedService.getPublicFeed(limit, cursor, filters);

      res.json(feed);
    } catch (error) {
      console.error("Error fetching public feed:", error);
      res.status(500).json({ 
        message: "Error fetching public feed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/feed/trending
   * Get trending posts based on engagement
   * Query params:
   * - limit: number of posts (default 10, max 50)
   * - cursor: pagination cursor (score_date format)
   * - timeWindow: days to look back (default 7)
   */
  async getTrendingFeed(req: AuthRequest, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const cursor = req.query.cursor as string;
      const timeWindow = parseInt(req.query.timeWindow as string) || 7;

      const feed = await feedService.getTrendingFeed(limit, cursor, timeWindow);

      res.json(feed);
    } catch (error) {
      console.error("Error fetching trending feed:", error);
      res.status(500).json({ 
        message: "Error fetching trending feed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  /**
   * GET /api/feed/discover
   * Get discovery feed (posts from users you don't follow)
   * This is useful for discovering new content
   */
  async getDiscoverFeed(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const cursor = req.query.cursor as string;
      const authCookie = req.cookies?.auth_token;

      // Get following IDs to exclude them
      const response = await fetch(
        `${process.env.USERS_SERVICE_URL || "http://users-service:3001"}/api/followers/my-following`,
        {
          headers: authCookie ? { Cookie: `auth_token=${authCookie}` } : {},
        }
      );

      const following = response.ok ? await response.json() : [];
      const excludeUserIds = [
        req.user.id,
        ...following.map((f: any) => f.followedId),
      ];

      const filters = {
        excludeUserIds,
      };

      const feed = await feedService.getPublicFeed(limit, cursor, filters);

      res.json(feed);
    } catch (error) {
      console.error("Error fetching discover feed:", error);
      res.status(500).json({ 
        message: "Error fetching discover feed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}