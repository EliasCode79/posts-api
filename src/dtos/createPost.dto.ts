export interface CreatePostDto {
  author_id: string;
  description: string;
  media_url?: string;
  media_type?: string;
  tags?: string[];
}
