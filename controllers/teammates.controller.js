class FriendController {
  constructor(db) {
    this.db = db;
  }

  getAllTeammates = async (request, response) => {
    try {
      const { navbar, userId } = request;

      const friends = await this.db.Friend.findAll({
        where: {
          user_id: userId,
        },
        include: [
          {
            model: this.db.User,
            as: "userFriend",
          },
          {
            model: this.db.User,
            as: "friends",
          },
        ],
      });

      response.render("teammates", {
        navbar,
        friends,
        mailvalid: "",
        invalid: "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  addTeammate = async (request, response) => {
    const { navbar, userId } = request;
    const user = request.body;
    try {
      const checkEmail = await this.db.User.findOne({
        where: {
          email: user.sendeeemail,
        },
      });

      if (checkEmail === null) {
        throw new Error("email does not exist");
      }

      const checkEmailJSON = checkEmail.toJSON();
      const receiptID = checkEmailJSON.id;

      const checkFriends = await this.db.Friend.findAll({
        where: {
          user_id: userId,
          friend_id: receiptID,
        },
        include: [
          {
            model: this.db.User,
            as: "userFriend",
          },
          {
            model: this.db.User,
            as: "friends",
          },
        ],
      });

      if (checkFriends.length > 0) {
        throw new Error("friend exists");
      }

      await this.db.Friend.create({
        user_id: userId,
        friend_id: receiptID,
      });

      response.redirect("/teammates");
    } catch (error) {
      console.log(error);
      const allFriends = await this.db.Friend.findAll({
        where: {
          user_id: userId,
        },
        include: [
          {
            model: this.db.User,
            as: "userFriend",
          },
          {
            model: this.db.User,
            as: "friends",
          },
        ],
      });

      if (error.message === "friend exists") {
        response.render("teammates", {
          navbar,
          friends: allFriends,
          invalid: "friend already exists",
          mailvalid: "is-invalid",
        });
      } else if (error.message === "email does not exist") {
        response.render("teammates", {
          navbar,
          friends: allFriends,
          invalid: "Email does not belong to any user",
          mailvalid: "is-invalid",
        });
      }
    }
  };

  deleteTeammates = async (request, response) => {
    try {
      const { userId } = request;
      const friendId = Number(request.params.id);
      await this.db.Friend.destroy({
        where: {
          id: friendId,
        },
      });

      response.redirect("/teammates");
    } catch (error) {
      console.log(error);
    }
  };
}

export default FriendController;
