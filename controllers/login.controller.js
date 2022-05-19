/* eslint-disable class-methods-use-this */
import cookieParser from 'cookie-parser';
import getHash from '../helperfunctions/hashsession.js';
import { validateForm } from '../helperfunctions/formvalidation.js';

class LoginController {
  constructor(db) {
    this.db = db;
  }

  getLogin = async (request, response) => {
    try {
      const validate = validateForm('', '', 'Enter valid password', 'Enter valid email');
      response.render('login', validate);
    } catch (error) {
      console.log(error);
    }
  }

  loginUser = async (request, response) => {
    try {
      const user = { ...request.body };
      const userEmail = user.email;
      const checkEmail = await this.db.User.findOne({  
        where: {
          email: userEmail
        }
      })

      if (checkEmail === null) {
        throw new Error('email does not exist');
      }

      const storedUser = checkEmail.toJSON();
      // check if password is correct
      const hashedUserPassword = getHash(user.password);

      if (storedUser.password !== hashedUserPassword) {
        throw new Error('incorrect password');
      } else {
        response.cookie('username', storedUser.name);
        response.cookie('userId', storedUser.id);
        response.cookie('hashedSession', getHash(storedUser.id));
        response.redirect('/projects');
      }
    } catch (error) {
      let validate;
      if (error.message === 'email does not exist') {
        validate = validateForm('is-invalid', '', 'Enter valid password', 'Email does not exists! Please sign up');
        response.render('login', validate);
      } else if (error.message === 'incorrect password') {
        validate = validateForm('is-valid', 'is-invalid', 'Wrong Password', '');
        response.render('login', validate);
      } else {
        console.log(error);
      }
    }
  }

  logoutUser = async (request, response) => {
    try {
      response.clearCookie('username');
      response.clearCookie('userId');
      response.clearCookie('hashedSession');
      response.redirect('/');
    } catch (error) {
      console.log(error);
    }
  }
}

export default LoginController;
