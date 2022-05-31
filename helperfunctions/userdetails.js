import db from "../db/models/index.js";

const getDetails = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await db.User.findOne({
      where: {
        id: userId,
      },
    });

    const navbar = {
      photo: user.photo,
      name: user.name,
    };
    request.navbar = navbar;
    next();
  } catch (error) {
    console.log(error);
  }
};

export default getDetails;
