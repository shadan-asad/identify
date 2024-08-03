import { Request, Response } from "express";
import { identifyService } from "../services/identifyService";

export const identifyController = async (req: Request, res: Response) => {
  try {
    const result = await identifyService(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error in identify controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
