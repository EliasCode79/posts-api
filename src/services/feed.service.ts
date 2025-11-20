// posts-api/src/services/feed.service.ts
import Post from "../models/post.model";
import { PostWithUser } from "../dtos/postWithUser.dto";
import { getUser, getUsers } from "../grpc/usersClient";
import { mediaClient } from "./mediaClient";
import { interactionsClient } from "./interactionsClient";
import axios from "axios";

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://users-service:3001";

interface FeedResponse {
  posts: PostWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

interface FeedFilters {
  mediaType?: "image" | "video" | "all";
  tags?: string[];
  excludeUserIds?: number[];
}

export class FeedService {
  /**
   * Get personalized feed for authenticated user
   * Algorithm:
   * 1. Fetch posts from users I follow (prioritized)
   * 2. Mix with posts from users I don't follow
   * 3. Sort by recency (newest first)
   * 4. Apply pagination with cursor
   */
  async getPersonalizedFeed(
    userId: number,
    limit: number = 10,
    cursor?: string,
    filters?: FeedFilters,
    authCookie?: string
  ): Promise<FeedResponse> {
    try {
      // 1. Get users that this user follows
      const followingIds = await this.getFollowingUserIds(userId, authCookie);
      console.log(`[Feed] User ${userId} follows ${followingIds.length} users`);

      // 2. Build query based on cursor
      const query: any = {};
      
      // Apply cursor for pagination
      if (cursor) {
        const cursorDate = new Date(cursor);
        query.created_at = { $lt: cursorDate };
      }

      // Apply filters
      if (filters?.mediaType && filters.mediaType !== "all") {
        query.media_type = filters.mediaType;
      }
      if (filters?.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      if (filters?.excludeUserIds && filters.excludeUserIds.length > 0) {
        query.author_id = { $nin: filters.excludeUserIds };
      }

      // 3. Fetch posts with smart algorithm
      let posts;
      
      if (followingIds.length > 0) {
        // Get posts from followed users first
        const followedPosts = await Post.find({
          ...query,
          author_id: { $in: followingIds },
        })
          .sort({ created_at: -1 })
          .limit(Math.ceil(limit * 0.7)); // 70% from followed users

        // Get remaining posts from everyone else
        const remainingLimit = limit - followedPosts.length;
        const otherPosts = remainingLimit > 0
          ? await Post.find({
              ...query,
              author_id: { $nin: [...followingIds, userId] }, // Exclude self and followed
            })
              .sort({ created_at: -1 })
              .limit(remainingLimit)
          : [];

        // Merge and sort by engagement score and recency
        posts = [...followedPosts, ...otherPosts].sort((a, b) => {
          // First, prioritize posts from followed users
          const aIsFollowed = followingIds.includes(a.author_id);
          const bIsFollowed = followingIds.includes(b.author_id);
          
          if (aIsFollowed && !bIsFollowed) return -1;
          if (!aIsFollowed && bIsFollowed) return 1;
          
          // Then sort by recency
          return b.created_at.getTime() - a.created_at.getTime();
        }).slice(0, limit);
      } else {
        // No followed users, just get recent posts
        posts = await Post.find({
          ...query,
          author_id: { $ne: userId }, // Exclude own posts
        })
          .sort({ created_at: -1 })
          .limit(limit);
      }

      // 4. Enrich posts with user, media, and interactions data
      const enrichedPosts = await this.enrichPosts(posts, userId);

      // 5. Generate next cursor
      const nextCursor = posts.length === limit && posts.length > 0
        ? posts[posts.length - 1].created_at.toISOString()
        : null;

      return {
        posts: enrichedPosts,
        nextCursor,
        hasMore: posts.length === limit,
        total: posts.length,
      };
    } catch (error) {
      console.error("[Feed] Error generating personalized feed:", error);
      throw error;
    }
  }

  /**
   * Get public feed (for non-authenticated users)
   * Simple chronological feed of all posts
   */
  async getPublicFeed(
    limit: number = 10,
    cursor?: string,
    filters?: FeedFilters
  ): Promise<FeedResponse> {
    try {
      const query: any = {};
      
      if (cursor) {
        const cursorDate = new Date(cursor);
        query.created_at = { $lt: cursorDate };
      }

      if (filters?.mediaType && filters.mediaType !== "all") {
        query.media_type = filters.mediaType;
      }
      if (filters?.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      const posts = await Post.find(query)
        .sort({ created_at: -1 })
        .limit(limit);

      const enrichedPosts = await this.enrichPosts(posts);

      const nextCursor = posts.length === limit && posts.length > 0
        ? posts[posts.length - 1].created_at.toISOString()
        : null;

      return {
        posts: enrichedPosts,
        nextCursor,
        hasMore: posts.length === limit,
        total: posts.length,
      };
    } catch (error) {
      console.error("[Feed] Error generating public feed:", error);
      throw error;
    }
  }

  /**
   * Get trending/popular feed
   * Based on engagement score and recency
   */
  async getTrendingFeed(
    limit: number = 10,
    cursor?: string,
    timeWindow: number = 7 // days
  ): Promise<FeedResponse> {
    try {
      const query: any = {
        created_at: {
          $gte: new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000),
        },
      };

      if (cursor) {
        const cursorParts = cursor.split("_");
        const cursorScore = parseInt(cursorParts[0]);
        const cursorDate = new Date(cursorParts[1]);
        
        query.$or = [
          { engagement_score: { $lt: cursorScore } },
          {
            engagement_score: cursorScore,
            created_at: { $lt: cursorDate },
          },
        ];
      }

      const posts = await Post.find(query)
        .sort({ engagement_score: -1, created_at: -1 })
        .limit(limit);

      const enrichedPosts = await this.enrichPosts(posts);

      const nextCursor = posts.length === limit && posts.length > 0
        ? `${posts[posts.length - 1].engagement_score}_${posts[posts.length - 1].created_at.toISOString()}`
        : null;

      return {
        posts: enrichedPosts,
        nextCursor,
        hasMore: posts.length === limit,
        total: posts.length,
      };
    } catch (error) {
      console.error("[Feed] Error generating trending feed:", error);
      throw error;
    }
  }

  /**
   * Helper: Get IDs of users that the given user follows
   */
  private async getFollowingUserIds(userId: number, authCookie?: string): Promise<number[]> {
    try {
      const config: any = {
        timeout: 5000,
      };

      if (authCookie) {
        config.headers = {
          Cookie: `auth_token=${authCookie}`,
        };
      }

      const response = await axios.get(
        `${USERS_SERVICE_URL}/api/followers/my-following`,
        config
      );

      // Extract followed user IDs from the response
      return response.data.map((follower: any) => follower.followedId);
    } catch (error) {
      console.error("[Feed] Error fetching following list:", error);
      return []; // Return empty array if can't fetch (graceful degradation)
    }
  }

  /**
   * Helper: Enrich posts with user, media, and interactions data
   */
  private async enrichPosts(posts: any[], currentUserId?: number): Promise<PostWithUser[]> {
    if (posts.length === 0) return [];

    // Extract unique author IDs and post IDs
    const authorIds = [...new Set(posts.map((p) => p.author_id))];
    const postIds = posts.map((p) => p.post_id);

    // Batch fetch users via gRPC, media via HTTP, and interactions via HTTP
    const [users, mediaResponse, interactions] = await Promise.all([
      getUsers(authorIds),
      mediaClient.getBatchMedia(postIds),
      interactionsClient.getBatchPostInteractions(postIds),
    ]);

    // Create maps for quick lookup
    const userMap = new Map(users.map((u) => [u.id, u]));
    const mediaMap = new Map(mediaResponse.found.map((m) => [m.post_id, m]));
    const interactionsMap = new Map(interactions.map((i) => [i.postId, i]));

    // Enrich posts with user, media, and interactions data
    return posts.map((post) => {
      const author = userMap.get(post.author_id);
      const media = mediaMap.get(post.post_id);
      const postInteractions = interactionsMap.get(post.post_id);

      return {
        post_id: post.post_id,
        author_id: post.author_id,
        author: author
          ? {
              id: author.id,
              username: author.username,
              first_name: author.first_name,
              last_name: author.last_name,
            }
          : {
              id: post.author_id,
              username: "Unknown",
              first_name: "Unknown",
              last_name: "User",
            },
        description: post.description,
        media: media || undefined,
        media_url: media?.file_url || post.media_url,
        media_type: media
          ? this.getMediaTypeFromFilename(media.filename)
          : post.media_type,
        tags: post.tags,
        engagement_score: post.engagement_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
        interactions: postInteractions,
        userLiked: false, // This would need to be checked per-user
      };
    });
  }

  private getMediaTypeFromFilename(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();

    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm"];

    if (imageExtensions.includes(extension || "")) {
      return "image";
    } else if (videoExtensions.includes(extension || "")) {
      return "video";
    } else {
      return "file";
    }
  }
}