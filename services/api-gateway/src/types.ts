import { Request, Response, NextFunction } from "express";

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head";

export type FunctionMap = {
  [key: string]: any;
};
