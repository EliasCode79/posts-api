// posts-api/src/dtos/createPost.dto.ts
export interface CreatePostDto {
  author_id: number; 
  description: string;
  media_file?: Express.Multer.File; // Add this for file upload
  media_url?: string; // Keep for backward compatibility
  media_type?: string;
  tags?: string[];
}