import { Request, Response } from "express";
import { PostService } from "../services/post.service";

const postService = new PostService();

export class PostController {
  async create(req: Request, res: Response) {
    try {
      const post = await postService.create(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Error creating post", error });
    }
  }

  async findAll(req: Request, res: Response) {
    const posts = await postService.findAll();
    res.json(posts);
  }

  async findById(req: Request, res: Response) {
    const post = await postService.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  }

  async update(req: Request, res: Response) {
    const updated = await postService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Post not found" });
    res.json(updated);
  }

  async delete(req: Request, res: Response) {
    const deleted = await postService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  }
}
