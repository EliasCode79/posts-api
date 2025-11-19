// posts-api/src/dtos/postWithUser.dto.ts
import { IPost } from "../models/post.model";
import { User } from "../grpc/usersClient";
import { MediaResponse } from "../services/mediaClient";
import { PostInteractions, Comment } from "../services/interactionsClient";

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
  media?: MediaResponse; // Changed from media_url to media object
  media_url?: string; // Keep for backward compatibility
  media_type?: string;
  tags: string[];
  engagement_score: number;
  created_at: Date;
  updated_at: Date;
  interactions?: PostInteractions;
  recentComments?: Comment[];
  userLiked?: boolean;
}