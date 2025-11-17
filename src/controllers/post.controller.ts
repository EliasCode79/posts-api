import { Response } from "express";
import { PostService } from "../services/post.service";
import { AuthRequest } from "../middleware/auth.middleware";

const postService = new PostService();

export class PostController {
  // Create post (authenticated user is the author)
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // User ID from JWT becomes author_id
      const postData = {
        ...req.body,
        author_id: req.user.id, // Force author to be authenticated user
      };

      const post = await postService.create(postData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Error creating post", error });
    }
  }

  // Get all posts (public, with user data enriched)
  async findAll(req: AuthRequest, res: Response) {
    try {
      const posts = await postService.findAll();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts", error });
    }
  }

  // Get single post by ID (public)
  async findById(req: AuthRequest, res: Response) {
    try {
      const post = await postService.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Error fetching post", error });
    }
  }

  // Get posts by author ID (public)
  async findByAuthor(req: AuthRequest, res: Response) {
    try {
      const authorId = parseInt(req.params.authorId);
      const posts = await postService.findByAuthor(authorId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching posts", error });
    }
  }

  // Get my posts (authenticated user's posts)
  async getMyPosts(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const posts = await postService.findByAuthor(req.user.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching your posts", error });
    }
  }

  // Update post (only if you're the author)
  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if post exists and user is the author
      const existingPost = await postService.findById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (existingPost.author_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only update your own posts" });
      }

      const updated = await postService.update(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Error updating post", error });
    }
  }

  // Delete post (only if you're the author)
  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if post exists and user is the author
      const existingPost = await postService.findById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (existingPost.author_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only delete your own posts" });
      }

      await postService.delete(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Error deleting post", error });
    }
  }
}