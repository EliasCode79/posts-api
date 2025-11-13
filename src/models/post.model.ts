import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  author_id: string;
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
    author_id: { type: String, required: true },
    description: { type: String, required: true },
    media_url: { type: String },
    media_type: { type: String },
    tags: { type: [String], default: [] },
    engagement_score: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IPost>("Post", PostSchema);
