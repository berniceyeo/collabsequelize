class ProfileController {
  constructor(db) {
    this.db = db;
  }

  getProfile = async (request, response) => {
    try {
      const { navbar, userId } = request;
      const getUser = await this.db.User.findOne({
        where: {
          id: userId,
        },
      });

      const user = getUser.toJSON();
      response.render("profile", { navbar, user });
    } catch (error) {
      console.log(error);
    }
  };

  uploadUserPhoto = async (request, response) => {
    try {
      const userId = Number(request.params.id);
      await this.db.User.update(
        {
          photo: request.file.location,
          updated_at: Date.now(),
        },
        {
          where: {
            id: userId,
          },
        }
      );
      response.redirect("/profile");
    } catch (error) {
      console.log(error);
    }
  };

  editProfile = async (request, response) => {
    try {
      const userId = Number(request.params.id);
      const user = request.body;
      await this.db.User.update(
        {
          name: user.name,
          email: user.email,
          contact: user.contact,
          role: user.role,
          workplace: user.workplace,
          updated_at: Date.now(),
        },
        {
          where: {
            id: userId,
          },
        }
      );
      response.redirect("/profile");
    } catch (error) {
      console.log(error);
    }
  };
}

export default ProfileController;
