import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface JwtPayload {
  uid: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ uid: userId } satisfies JwtPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (typeof decoded === "object" && decoded !== null && "uid" in decoded) {
      return decoded as JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
}
