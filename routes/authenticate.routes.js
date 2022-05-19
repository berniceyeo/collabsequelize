/* eslint-disable comma-dangle */
/* eslint-disable import/extensions */

import { Router } from 'express';
import pool from '../helperfunctions/pool.js';
import db from '../db/models/index.js'

import LoginController from '../controllers/login.controller.js';
import SignupController from '../controllers/signup.controller.js';

const router = Router();
const prefix = '/signup';

const loginController = new LoginController(db);
const signupController = new SignupController(db);

router.get('/', loginController.getLogin);
router.post('/', loginController.loginUser);
router.get('/logout', loginController.logoutUser);
router.get(`${prefix}`, signupController.getSignupForm);
router.post(`${prefix}`, signupController.signupUser);

export default router;
