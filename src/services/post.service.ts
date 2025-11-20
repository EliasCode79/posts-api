// posts-api/src/services/post.service.ts
import Post, { IPost } from "../models/post.model";
import { CreatePostDto } from "../dtos/createPost.dto";
import { UpdatePostDto } from "../dtos/updatePost.dto";
import { PostWithUser } from "../dtos/postWithUser.dto";
import { getUser, getUsers } from "../grpc/usersClient";
import { mediaClient, MediaResponse } from "./mediaClient";
import { interactionsClient, PostInteractions } from "./interactionsClient";
import { randomBytes } from "crypto";

export class PostService {
  async create(data: CreatePostDto, authCookie?: string): Promise<IPost> {
    // Generate unique post_id
    const post_id = `post_${randomBytes(8).toString("hex")}_${Date.now()}`;

    let media_url: string | undefined;
    let media_type: string | undefined;

    // Upload media if provided
    if (data.media_file) {
      try {
        const mediaResponse = await mediaClient.uploadMedia(
          post_id,
          data.media_file,
          authCookie
        );
        media_url = mediaResponse.file_url;
        media_type = this.getMediaTypeFromFilename(mediaResponse.filename);
      } catch (error) {
        console.error("Error uploading media:", error);
        // Continue creating post even if media upload fails
      }
    }

    const post = new Post({
      ...data,
      post_id,
      media_url,
      media_type,
    });
    return await post.save();
  }

  async findAll(): Promise<PostWithUser[]> {
    const posts = await Post.find().sort({ created_at: -1 });

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
        // NEW: Add interactions data
        interactions: postInteractions,
        userLiked: false, // You can implement this later with user context
      };
    });
  }

  async findByPostId(post_id: string): Promise<PostWithUser | null> {
    const post = await Post.findOne({ post_id });
    if (!post) return null;

    // Fetch user data via gRPC, media via HTTP, and interactions via HTTP
    const [author, media, interactions, recentComments] = await Promise.all([
      getUser(post.author_id).catch(() => null),
      mediaClient.getMediaByPostId(post.post_id).catch(() => null),
      interactionsClient.getPostInteractions(post.post_id),
      interactionsClient.getPostComments(post.post_id, 3, 0), // Get 3 most recent comments
    ]);

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
      // NEW: Add interactions data
      interactions,
      recentComments: recentComments.comments,
      userLiked: false,
    };
  }

  async findById(id: string): Promise<PostWithUser | null> {
    const post = await Post.findById(id);
    if (!post) return null;

    const [author, media, interactions, recentComments] = await Promise.all([
      getUser(post.author_id).catch(() => null),
      mediaClient.getMediaByPostId(post.post_id).catch(() => null),
      interactionsClient.getPostInteractions(post.post_id),
      interactionsClient.getPostComments(post.post_id, 3, 0),
    ]);

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
      // NEW: Add interactions data
      interactions,
      recentComments: recentComments.comments,
      userLiked: false,
    };
  }

  async update(
    id: string,
    data: UpdatePostDto,
    authCookie?: string
  ): Promise<IPost | null> {
    const existingPost = await Post.findById(id);
    if (!existingPost) return null;

    return await Post.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string, authCookie?: string): Promise<IPost | null> {
    const post = await Post.findById(id);
    if (!post) return null;

    // Delete associated media
    try {
      await mediaClient.deleteMedia(post.post_id, authCookie);
    } catch (error) {
      console.error("Error deleting media:", error);
    }

    return await Post.findByIdAndDelete(id);
  }

  async findByAuthor(authorId: number): Promise<PostWithUser[]> {
    const posts = await Post.find({ author_id: authorId }).sort({
      created_at: -1,
    });

    const postIds = posts.map((p) => p.post_id);

    const [author, mediaResponse, interactions] = await Promise.all([
      getUser(authorId).catch(() => null),
      mediaClient.getBatchMedia(postIds).catch(() => ({
        found: [],
        not_found: [],
        total_found: 0,
        total_requested: 0,
      })),
      interactionsClient.getBatchPostInteractions(postIds),
    ]);

    const mediaMap = new Map(mediaResponse.found.map((m) => [m.post_id, m]));
    const interactionsMap = new Map(interactions.map((i) => [i.postId, i]));

    return posts.map((post) => {
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
        // NEW: Add interactions data
        interactions: postInteractions,
        userLiked: false,
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

  // In PostService class
  async updateByPostId(
    postId: string,
    data: UpdatePostDto,
    authCookie?: string
  ): Promise<IPost | null> {
    return await Post.findOneAndUpdate({ post_id: postId }, data, {
      new: true,
    });
  }

  async deleteByPostId(
    postId: string,
    authCookie?: string
  ): Promise<IPost | null> {
    // Delete associated media
    try {
      await mediaClient.deleteMedia(postId, authCookie);
    } catch (error) {
      console.error("Error deleting media:", error);
    }

    return await Post.findOneAndDelete({ post_id: postId });
  }
}
