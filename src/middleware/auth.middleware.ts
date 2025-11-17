import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

// Middleware to extract user info from JWT (Kong already validated it)
export const extractUserFromJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get JWT from cookie (Kong already validated this)
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Decode JWT payload WITHOUT verifying (Kong did that)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Decode payload (base64url decode)
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    const claims = JSON.parse(payload);

    // Extract user info from claims
    const userId = parseInt(claims.sub);
    if (!userId) {
      return res.status(401).json({ error: "Invalid user ID in token" });
    }

    // Store user info in request object
    req.user = {
      id: userId,
      username: claims.username || "",
      email: claims.email || "",
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Failed to decode token" });
  }
};

// Optional auth middleware (doesn't fail if not authenticated)
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.auth_token;
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
        const claims = JSON.parse(payload);
        const userId = parseInt(claims.sub);
        if (userId) {
          req.user = {
            id: userId,
            username: claims.username || "",
            email: claims.email || "",
          };
        }
      }
    }
  } catch (error) {
    // Silently fail, continue without user info
  }
  next();
};