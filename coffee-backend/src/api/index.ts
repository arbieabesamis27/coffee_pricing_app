import app from "../server.js";
import { Request, Response } from "express";

// ✅ Vercel requires a handler function
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
