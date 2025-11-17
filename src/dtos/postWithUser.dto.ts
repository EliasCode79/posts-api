import { IPost } from "../models/post.model";
import { User } from "../grpc/usersClient";

export interface PostWithUser {
  post_id: string;
  author_id: number;
  author: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  description: string;
  media_url?: string;
  media_type?: string;
  tags: string[];
  engagement_score: number;
  created_at: Date;
  updated_at: Date;
}