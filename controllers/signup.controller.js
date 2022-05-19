/* eslint-disable class-methods-use-this */
import getHash from '../helperfunctions/hashsession.js';
import { validateForm } from '../helperfunctions/formvalidation.js';

class SignupController {
  constructor(db) {
    this.db = db;
  }

  getSignupForm = async (request, response) => {
    try {
      const validate = validateForm('', '', 'Enter valid password', 'Enter valid email');
      response.render('signup', validate);
    } catch (error) {
      console.log(error);
    }
  }

  signupUser = async (request, response) => {
    try {
      const user = { ...request.body };
      const checkEmail = await this.db.User.findOne({  
        where: {
          email: user.email
        }
      });

      if (checkEmail !== null) {
        throw new Error('registered email');
      }

      const hashedPassword = getHash(user.password);
      console.log(hashedPassword)

      const createdUser = await this.db.User.create({  
        name: user.name,
        email: user.email, 
        password: hashedPassword,

      });

      console.log(createdUser.toJSON());
      response.redirect('/');
    } catch (error) {
      if (error.message === 'registered email') {
        const validate = validateForm('is-invalid', '', 'Enter valid password', 'Email has already been registered');
        response.render('signup', validate);
      }
      console.log(error)
    }
  }
}

export default SignupController;
