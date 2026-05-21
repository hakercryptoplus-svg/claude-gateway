import { Router, type IRouter } from "express";
  import healthRouter from "./health";
  import apiKeysRouter from "./apikeys";
  import completionsRouter from "./completions";

  const router: IRouter = Router();
  router.use(healthRouter);
  router.use(apiKeysRouter);
  router.use(completionsRouter);

  export default router;
  