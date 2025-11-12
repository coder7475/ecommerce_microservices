import { Request, Response, NextFunction } from "express";
import { FunctionMap } from "./types";
import axios from "axios";
import { AUTH_SERVICE } from "./config";

const auth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["authorization"]) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    const { data } = await axios.post(`${AUTH_SERVICE}/auth/verify-token`, {
      accessToken: token,
      headers: {
        ip: req.ip,
        "user-agent": req.headers["user-agent"] || "",
      },
    });

    req.headers["x-user-id"] = data.user.id;
    req.headers["x-user-email"] = data.user.email;
    req.headers["x-user-name"] = data.user.name;
    req.headers["x-user-role"] = data.user.role;

    next();
  } catch (error) {
    console.log("[Auth Middleware]", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const middlewares: FunctionMap = { auth };

export default middlewares;
