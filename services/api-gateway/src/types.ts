// import { Request, Response, NextFunction } from "express";
import middlewares from "./middlewares";

// export type Middleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => Promise<void> | void;

export type MiddlewareName = keyof typeof middlewares;
