import { Request, Response, NextFunction } from "express";

const auth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const middlewares = [auth];

export default middlewares;
