import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  post_id: string; // NEW: Unique post identifier
  author_id: number; // Changed to number to match user ID
  description: string;
  media_url?: string;
  media_type?: string;
  tags: string[];
  engagement_score: number;
  created_at: Date;
  updated_at: Date;
}

const PostSchema = new Schema<IPost>(
  {
    post_id: { type: String, required: true, unique: true }, // NEW
    author_id: { type: Number, required: true }, // Changed to Number
    description: { type: String, required: true },
    media_url: { type: String },
    media_type: { type: String },
    tags: { type: [String], default: [] },
    engagement_score: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Index for faster queries
PostSchema.index({ author_id: 1 });
PostSchema.index({ post_id: 1 });

export default mongoose.model<IPost>("Post", PostSchema);