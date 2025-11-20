// posts-api/src/controllers/post.controller.ts
import { Response } from "express";
import { PostService } from "../services/post.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { RabbitMQPublisher } from "../services/rabbitmqPublisher";
import { interactionsClient } from "../services/interactionsClient";

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
      // Use findByPostId since URL parameter is post_id, not MongoDB _id
      const post = await postService.findByPostId(req.params.id);
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
      const postId = req.params.id; // This is post_id

      // Use findByPostId to check existence and ownership
      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (existingPost.author_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only update your own posts" });
      }

      // For now, let's skip the update until we fix the service method
      // This will at least stop the error
      return res.status(501).json({ message: "Update endpoint needs refactoring to use post_id" });
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
      const postId = req.params.id; // This is post_id

      // Use findByPostId to check existence and ownership
      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (existingPost.author_id !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Forbidden: You can only delete your own posts" });
      }

      // For now, let's skip the delete until we fix the service method
      // This will at least stop the error
      return res.status(501).json({ message: "Delete endpoint needs refactoring to use post_id" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(400).json({ message: "Error deleting post", error });
    }
  }

  // Like/Unlike and Comment methods remain the same
  async likePost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = req.params.id;
      const userId = req.user.id.toString();

      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

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

  async unlikePost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = req.params.id;
      const userId = req.user.id.toString();

      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

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

      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

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

  async checkLikeStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const postId = req.params.id;
      const userId = req.user.id.toString();
      const authCookie = req.cookies?.auth_token;

      const existingPost = await postService.findByPostId(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const liked = await interactionsClient.checkUserLikedPost(
        postId,
        userId,
        authCookie
      );

      return res.json({ liked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Error checking like status", error });
    }
  }
}