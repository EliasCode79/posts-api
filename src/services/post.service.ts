import Post, { IPost } from "../models/post.model";
import { CreatePostDto } from "../dtos/createPost.dto";
import { UpdatePostDto } from "../dtos/updatePost.dto";

export class PostService {
  async create(data: CreatePostDto): Promise<IPost> {
    const post = new Post(data);
    return await post.save();
  }

  async findAll(): Promise<IPost[]> {
    return await Post.find().sort({ created_at: -1 });
  }

  async findById(id: string): Promise<IPost | null> {
    return await Post.findById(id);
  }

  async update(id: string, data: UpdatePostDto): Promise<IPost | null> {
    return await Post.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<IPost | null> {
    return await Post.findByIdAndDelete(id);
  }
}
