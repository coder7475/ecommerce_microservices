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
      const { data } = await axios({
        method,
        url: `${hostname}/api/${path}`,
        data: req.body,
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
        // console.log(method_lower, path, hostname);
        const handler = createHandler(hostname, path, method_lower);
        console.log(`api/${path}`);
        app[method_lower](`/api/${path}`, handler);
      });
    });
  });
};
