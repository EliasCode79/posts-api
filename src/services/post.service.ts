import Post, { IPost } from "../models/post.model";
import { CreatePostDto } from "../dtos/createPost.dto";
import { UpdatePostDto } from "../dtos/updatePost.dto";
import { PostWithUser } from "../dtos/postWithUser.dto";
import { getUser, getUsers } from "../grpc/usersClient";
import { randomBytes } from "crypto";

export class PostService {
  async create(data: CreatePostDto): Promise<IPost> {
    // Generate unique post_id using crypto instead of uuid
    const post_id = `post_${randomBytes(8).toString('hex')}_${Date.now()}`;
    
    const post = new Post({
      ...data,
      post_id,
    });
    return await post.save();
  }

  // ... rest of your service methods remain the same
  async findAll(): Promise<PostWithUser[]> {
    const posts = await Post.find().sort({ created_at: -1 });

    // Extract unique author IDs
    const authorIds = [...new Set(posts.map((p) => p.author_id))];

    // Batch fetch users via gRPC
    const users = await getUsers(authorIds);

    // Create a map for quick lookup
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Enrich posts with user data
    return posts.map((post) => {
      const author = userMap.get(post.author_id);
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
        media_url: post.media_url,
        media_type: post.media_type,
        tags: post.tags,
        engagement_score: post.engagement_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
      };
    });
  }

  async findById(id: string): Promise<PostWithUser | null> {
    const post = await Post.findById(id);
    if (!post) return null;

    // Fetch user data via gRPC
    try {
      const author = await getUser(post.author_id);
      return {
        post_id: post.post_id,
        author_id: post.author_id,
        author: {
          id: author.id,
          username: author.username,
          first_name: author.first_name,
          last_name: author.last_name,
        },
        description: post.description,
        media_url: post.media_url,
        media_type: post.media_type,
        tags: post.tags,
        engagement_score: post.engagement_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
      };
    } catch (error) {
      // Return post without user data if gRPC fails
      return {
        post_id: post.post_id,
        author_id: post.author_id,
        author: {
          id: post.author_id,
          username: "Unknown",
          first_name: "Unknown",
          last_name: "User",
        },
        description: post.description,
        media_url: post.media_url,
        media_type: post.media_type,
        tags: post.tags,
        engagement_score: post.engagement_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
      };
    }
  }

  async update(id: string, data: UpdatePostDto): Promise<IPost | null> {
    return await Post.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IPost | null> {
    return await Post.findByIdAndDelete(id);
  }

  // NEW: Get posts by author
  async findByAuthor(authorId: number): Promise<PostWithUser[]> {
    const posts = await Post.find({ author_id: authorId }).sort({
      created_at: -1,
    });

    try {
      const author = await getUser(authorId);
      return posts.map((post) => ({
        post_id: post.post_id,
        author_id: post.author_id,
        author: {
          id: author.id,
          username: author.username,
          first_name: author.first_name,
          last_name: author.last_name,
        },
        description: post.description,
        media_url: post.media_url,
        media_type: post.media_type,
        tags: post.tags,
        engagement_score: post.engagement_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
      }));
    } catch (error) {
      return posts.map((post) => ({
        post_id: post.post_id,
        author_id: post.author_id,
        author: {
          id: post.author_id,
          username: "Unknown",
          first_name: "Unknown",
          last_name: "User",
        },
        description: post.description,
        media_url: post.media_url,
        media_type: post.media_type,
        tags: post.tags,
        engagement_score: post.engagement_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
      }));
    }
  }
}