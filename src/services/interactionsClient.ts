// posts-api/src/services/interactionsClient.ts
import axios from 'axios';

const INTERACTIONS_SERVICE_URL = process.env.INTERACTIONS_SERVICE_URL || 'http://interactions-service:3000';

export interface PostInteractions {
  postId: string;
  likesCount: number;
  commentsCount: number;
  lastActivityAt: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}

class InteractionsClient {
  private client = axios.create({
    baseURL: INTERACTIONS_SERVICE_URL,
    timeout: 5000,
  });

  async getPostInteractions(postId: string): Promise<PostInteractions> {
    try {
      const response = await this.client.get(`/api/interactions/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching interactions for post ${postId}:`, error);
      // Return default values if service is unavailable
      return {
        postId,
        likesCount: 0,
        commentsCount: 0,
        lastActivityAt: null
      };
    }
  }

  async getBatchPostInteractions(postIds: string[]): Promise<PostInteractions[]> {
    if (postIds.length === 0) return [];

    try {
      // Since your interactions service doesn't have a batch endpoint yet,
      // we'll make individual requests in parallel
      const promises = postIds.map(postId => this.getPostInteractions(postId));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching batch interactions:', error);
      return postIds.map(postId => ({
        postId,
        likesCount: 0,
        commentsCount: 0,
        lastActivityAt: null
      }));
    }
  }

  async getPostComments(postId: string, limit: number = 3, offset: number = 0): Promise<CommentsResponse> {
    try {
      const response = await this.client.get(`/api/interactions/posts/${postId}/comments`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return {
        comments: [],
        total: 0,
        hasMore: false
      };
    }
  }

  async checkUserLike(postId: string, userId: string): Promise<boolean> {
    try {
      // Note: This would require adding user context, but for now we'll skip
      // since your current implementation doesn't support user-specific likes in GET
      return false;
    } catch (error) {
      console.error(`Error checking like for post ${postId}:`, error);
      return false;
    }
  }
}

export const interactionsClient = new InteractionsClient();