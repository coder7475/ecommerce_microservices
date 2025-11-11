import { Request, Response, NextFunction } from "express";
import { FunctionMap } from "./types";

const auth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const middlewares: FunctionMap = { auth };

export default middlewares;
