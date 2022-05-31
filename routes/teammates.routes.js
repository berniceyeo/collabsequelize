import { Router } from "express";
import db from "../db/models/index.js";
import authenticate from "../helperfunctions/authenticate.js";
import getDetails from "../helperfunctions/userdetails.js";

import FriendController from "../controllers/teammates.controller.js";

const router = Router();
const prefix = "/teammates";

const teammatesController = new FriendController(db);

router.get(
  `${prefix}`,
  authenticate,
  getDetails,
  teammatesController.getAllTeammates
);
router.post(
  `${prefix}/add`,
  authenticate,
  getDetails,
  teammatesController.addTeammate
);
router.delete(
  `${prefix}/:id`,
  authenticate,
  getDetails,
  teammatesController.deleteTeammates
);

export default router;
