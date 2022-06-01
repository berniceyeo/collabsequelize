import dynamicSort from "../helperfunctions/sorting.js";
import checkDueDate from "../helperfunctions/checkOverdue.js";

class TaskController {
  constructor(db) {
    this.db = db;
  }

  getAllTasks = async (request, response) => {
    try {
      const { navbar, userId } = request;
      const { pendingSortBy } = request.query;
      const { completedSortBy } = request.query;

      const completed = await this.db.Task.findAll({
        where: {
          accepted: "accepted",
          status: "completed",
          assigned_to: userId,
        },
      });

      const pending = await this.db.Task.findAll({
        where: {
          accepted: "accepted",
          status: "pending",
          assigned_to: userId,
        },
      });

      const checkpendingTasks = dynamicSort(pendingSortBy, pending);
      const pendingTasks = checkDueDate(checkpendingTasks);
      const completedTasks = dynamicSort(completedSortBy, completed);

      response.render("tasks", { completedTasks, pendingTasks, navbar });
    } catch (err) {
      console.error(err);
    }
  };

  changeTaskStatus = async (request, response) => {
    try {
      const { projId, taskId, taskStatus } = request.query;
      await this.db.Task.update(
        {
          status: taskStatus,
        },
        {
          where: {
            id: taskId,
          },
        }
      );

      const tasks = await this.db.Task.findAll({
        where: {
          proj_id: projId,
        },
      });

      const completed = await this.db.Task.findAll({
        where: {
          status: "completed",
          proj_id: projId,
        },
      });

      const totalTasks = tasks.length;
      const completedTasks = completed.length;

      let progress = 0;
      if (completedTasks === 0) {
        progress = 0;
      } else {
        progress = Math.floor((completedTasks / totalTasks) * 100);
      }

      let progressStatus = "";
      if (progress === 100) {
        progressStatus = "completed";
      } else {
        progressStatus = "pending";
      }

      await this.db.Project.update(
        {
          progress: progress,
          status: progressStatus,
        },
        {
          where: {
            id: projId,
          },
        }
      );

      if (request.path === "/tasks/all/completed") {
        response.redirect("/tasks/all");
      } else {
        response.redirect(`/projects/${projId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  getAcceptTaskForm = async (request, response) => {
    try {
      const { id } = request.params;
      const { navbar } = request;
      const task = await this.db.Message.findOne({
        where: {
          id: id,
        },
        include: {
          model: this.db.Task,
          include: {
            model: this.db.User,
            as: "createdBy",
          },
        },
      });

      console.log(task);
      response.render("accepttasks", { task, navbar });
    } catch (err) {
      console.error(err);
    }
  };

  acceptTask = async (request, response) => {
    try {
      const messageId = Number(request.params.id);
      const { accept } = request.body;
      const messages = await this.db.Message.findOne({
        where: {
          id: messageId,
        },
      });

      const taskId = Number(messages.task_id);

      await this.db.Task.update(
        {
          accepted: accept,
        },
        {
          where: {
            id: taskId,
          },
        }
      );

      await this.db.Message.update(
        {
          accept: accept,
        },
        {
          where: {
            id: messageId,
          },
        }
      );

      response.redirect("/inbox");
    } catch (err) {
      console.error(err);
    }
  };

  resendTaskForm = async (request, response) => {
    try {
      const { id } = request.params;
      const { navbar } = request;
      const task = await this.db.Message.findAll({
        where: {
          id: id,
        },
        indlude: [
          {
            model: this.db.Task,
            as: "task_id",
          },
          {
            model: this.db.User,
            as: "sendTo",
          },
        ],
      });

      response.render("resendtasks", {
        task,
        navbar,
        mailvalid: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  resendTask = async (request, response) => {
    const { navbar } = request;
    const id = Number(request.params.id);
    try {
      const { sendeeemail } = request.body;
      const findUser = await this.db.User.findOne({
        where: {
          email: sendeeemail,
        },
      });

      if (findUser === null) {
        throw new Error("user does not exist");
      } else {
        const user = findUser.toJSON();
        const receiptID = Number(user.id);
        await this.db.User.update(
          {
            assigned_to: receiptID,
          },
          {
            where: {
              id: id,
            },
          }
        );

        await this.db.Message.create({
          send_to: receiptID,
          task_id: id,
          accept: "pending",
        });

        await this.db.Task.update(
          {
            accepted: "no",
          },
          {
            where: {
              id: id,
            },
          }
        );

        response.redirect("/inbox");
      }
    } catch (error) {
      const findTasks = await this.db.Task.findOne({
        where: {
          id: id,
        },
      });
      const task = findTasks.toJSON();

      if (error.message === "user does not exist") {
        // sends back to the form modal that the email input is invalid
        response.render("resendtasks", {
          navbar,
          task,
          mailvalid: "is-invalid",
        });
      }
    }
  };
}

export default TaskController;
