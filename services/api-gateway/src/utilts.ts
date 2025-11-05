import axios from "axios";
import type { Express, Request, Response } from "express";
import config from "./config.json";

export const createHandler = (
  hostname: string,
  path: string,
  method: string
) => {
  // Placeholder for actual handler creation logic
  return async (req: Request, res: Response) => {
    try {
      let url = `${hostname}/api/${path}`;

      // Replace path parameters
      req.params &&
        Object.keys(req.params).forEach((param) => {
          url = url.replace(`:${param}`, req.params[param]);
        });

      const { data } = await axios({
        method,
        url,
        data: req.body,
        headers: {
          origin: "http://localhost:5173",
        },
      });

      res.json(data);
    } catch (error) {
      if (error instanceof axios.AxiosError) {
        return res
          .status(error.response?.status || 500)
          .json(error.response?.data);
      }
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

export const configureRoutes = (app: Express) => {
  const services = Object.entries(config.services);

  services.forEach(([serviceName, serviceConfig]) => {
    const hostname = serviceConfig.url;
    const routes = serviceConfig.routes;

    routes.forEach((route) => {
      route.methods.forEach((method) => {
        const method_lower = method.toLowerCase();
        const path = route.path;

        const handler = createHandler(hostname, path, method_lower);

        app[method_lower](`/api/${path}`, handler);
      });
    });
  });
};
