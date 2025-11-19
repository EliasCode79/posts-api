// posts-api/src/services/mediaClient.ts
import axios from 'axios';
import FormData from 'form-data';

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL || 'http://media-service:5000';

export interface MediaResponse {
  id: string;
  post_id: string;
  filename: string;
  file_url: string;
  uploaded_at: string;
}

export interface BatchMediaResponse {
  found: MediaResponse[];
  not_found: string[];
  total_found: number;
  total_requested: number;
}

export class MediaClient {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: MEDIA_SERVICE_URL,
      timeout: 10000,
    });
  }

  /**
   * Upload media for a post
   */
  async uploadMedia(postId: string, file: Express.Multer.File, authCookie?: string): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('post_id', postId);
    
    // Fix: Use Buffer directly with FormData
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const headers: any = {
      ...formData.getHeaders(),
    };

    // Add auth cookie if provided
    if (authCookie) {
      headers.Cookie = `auth_token=${authCookie}`;
    }

    const response = await this.axiosInstance.post('/api/media/upload', formData, {
      headers,
    });

    return response.data;
  }

  /**
   * Get media for a specific post
   */
  async getMediaByPostId(postId: string): Promise<MediaResponse | null> {
    try {
      const response = await this.axiosInstance.get(`/api/media/post/${postId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No media for this post
      }
      throw error;
    }
  }

  /**
   * Get media for multiple posts in batch
   */
  async getBatchMedia(postIds: string[]): Promise<BatchMediaResponse> {
    try {
      const response = await this.axiosInstance.post('/api/media/batch', {
        post_ids: postIds,
      });
      return response.data;
    } catch (error: any) {
      // If batch fails, return empty found array
      return {
        found: [],
        not_found: postIds,
        total_found: 0,
        total_requested: postIds.length,
      };
    }
  }

  /**
   * Delete media for a post
   */
  async deleteMedia(postId: string, authCookie?: string): Promise<void> {
    const headers: any = {};

    // Add auth cookie if provided
    if (authCookie) {
      headers.Cookie = `auth_token=${authCookie}`;
    }

    await this.axiosInstance.delete(`/api/media/post/${postId}`, {
      headers,
    });
  }
}

export const mediaClient = new MediaClient();