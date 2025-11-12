import { Request, Response, NextFunction } from "express";
import { FunctionMap } from "./types";
import axios from "axios";

const auth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    const { data } = await axios.post("/auth/verify-token", {
      accessToken: token,
    });

    req.headers["x-user-id"] = data.user.id;
    req.headers["x-user-email"] = data.user.email;
    req.headers["x-user-name"] = data.user.name;

    next();
  } catch (error) {
    console.log("[Auth Middleware]", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const middlewares: FunctionMap = { auth };

export default middlewares;
