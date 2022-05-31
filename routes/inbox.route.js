import { Router } from 'express';
import authenticate from '../helperfunctions/authenticate.js';
import getDetails from '../helperfunctions/userdetails.js';
import db from '../db/models/index.js';
import InboxController from '../controllers/inbox.controller.js';

const router = Router();

const inboxController = new InboxController(db);

router.get('/inbox', authenticate, getDetails, inboxController.getInbox);

export default router;
