// posts-api/src/controllers/post.controller.ts
import { Response } from "express";
import { PostService } from "../services/post.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { RabbitMQPublisher } from "../services/rabbitmqPublisher";

const postService = new PostService();
const rabbitPublisher = new RabbitMQPublisher();

rabbitPublisher.connect().catch(console.error);

export class PostController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const authCookie = req.cookies?.auth_token;

      const postData = {
        ...req.body,
        author_id: req.user.id,
        media_file: req.file,
      };

      const post = await postService.create(postData, authCookie);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Error creating post", error });
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      const posts = await postService.findAll();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Error fetching posts", error });
    }
  }

  async findById(req: AuthRequest, res: Response) {
    try {
      const post = await postService.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Error fetching post", error });
    }
  }

  async findByAuthor(req: AuthRequest, res: Response) {
    try {
      const authorId = parseInt(req.params.authorId);
      const posts = await postService.findByAuthor(authorId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Error fetching posts", error });
    }
  }

  async getMyPosts(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const posts = await postService.findByAuthor(req.user.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching your posts:", error);
      res.status(500).json({ message: "Error fetching your posts", error });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const authCookie = req.cookies?.auth_token;

      const existingPost = await postService.findById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (existingPost.author_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only update your own posts" });
      }

      const updated = await postService.update(
        req.params.id,
        req.body,
        authCookie
      );
      res.json(updated);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(400).json({ message: "Error updating post", error });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const authCookie = req.cookies?.auth_token;

      const existingPost = await postService.findById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (existingPost.author_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only delete your own posts" });
      }

      await postService.delete(req.params.id, authCookie);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(400).json({ message: "Error deleting post", error });
    }
  }

  // ✅ FIXED: Use post_id instead of _id
  async likePost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = req.params.id; // This is post_id from the URL
      const userId = req.user.id.toString();

      // ✅ Changed to use post_id
      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Publish like message to RabbitMQ
      await rabbitPublisher.publishLikeCreation({
        targetType: "post",
        targetId: postId,
        userId: userId,
      });

      return res.json({
        liked: true,
        message: "Like queued for processing",
        postId: postId,
      });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(400).json({ message: "Error liking post", error });
    }
  }

  // ✅ FIXED: Use post_id instead of _id
  async unlikePost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = req.params.id;
      const userId = req.user.id.toString();

      // ✅ Changed to use post_id
      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Publish unlike message to RabbitMQ
      await rabbitPublisher.publishLikeDeletion({
        targetType: "post",
        targetId: postId,
        userId: userId,
      });

      return res.json({
        liked: false,
        message: "Unlike queued for processing",
        postId: postId,
      });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(400).json({ message: "Error unliking post", error });
    }
  }

  // ✅ FIXED: Use post_id instead of _id
  async createComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = req.params.id;
      const { text, parentCommentId } = req.body;
      const userId = req.user.id.toString();

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Comment text is required" });
      }

      // ✅ Changed to use post_id
      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Publish comment message to RabbitMQ
      await rabbitPublisher.publishCommentCreation({
        postId: postId,
        authorId: userId,
        text: text.trim(),
        parentCommentId: parentCommentId || null,
      });

      return res.status(201).json({
        message: "Comment queued for processing",
        postId: postId,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Error creating comment", error });
    }
  }
}