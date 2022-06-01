import moment from "moment";
import dynamicSort from "../helperfunctions/sorting.js";
import {
  sliceIntoChunks,
  sliceForEdit,
} from "../helperfunctions/subtaskhandler.js";
import { createEmpty } from "../helperfunctions/formvalidation.js";

class ProjectController {
  constructor(db) {
    this.db = db;
  }

  addProjectForm = async (request, response) => {
    try {
      const { navbar, userId } = request;
      const friends = await this.db.User.findOne({
        where: {
          id: userId,
        },
        include: [
          {
            model: this.db.Friend,
            as: "userFriend",
          },
        ],
      });

      const friendsJSON = friends.toJSON();
      response.render("createproject", { navbar, friends: friendsJSON });
    } catch (err) {
      console.error(err);
    }
  };

  addProject = async (request, response) => {
    //creating a string of dependent operations such that it would only be committed once all the queries were successfully done.
    const transaction = await this.db.sequelize.transaction();
    try {
      const { navbar, userId } = request;
      const user = request.body;
      const [name, description, duedate, ...tasks] = Object.values(user);
      const slicedArray = sliceIntoChunks(tasks);
      const validationArray = createEmpty(slicedArray);
      const fomattedDueDate = moment(duedate).format("DD MMM YYYY hh:mm");

      const insertProj = await this.db.Project.create(
        {
          name: name,
          description: description,
          due_date: fomattedDueDate,
          status: "pending",
          progress: 0,
          created_by: userId,
        },
        { transaction }
      );

      const newProj = insertProj.toJSON();
      const projId = newProj.id;

      // do validation for emails first
      for (let i = 0; i < slicedArray.length; i++) {
        const chunk = slicedArray[i];
        const [taskName, taskduedate, email] = chunk;
        const formattedTDueDate = moment(taskduedate).format(
          "DD MMM YYYY hh:mm"
        );

        const checkEmail = await this.db.User.findOne(
          {
            where: {
              email: email,
            },
          },
          { transaction }
        );

        if (checkEmail === null) {
          validationArray[i] = "is-invalid";
          const object = { ...user, validation: validationArray };
          response.render("createprojectvalidate", { ...object, navbar });
          throw new Error("email is invalid");
        }

        const userJson = checkEmail.toJSON();
        const receiptId = userJson.id;

        const insertTasks = await this.db.Task.create(
          {
            name: taskName,
            due_date: formattedTDueDate,
            accepted: "no",
            status: "pending",
            proj_id: projId,
            created_by: userId,
            assigned_to: receiptId,
          },
          { transaction }
        );

        const task = insertTasks.toJSON();
        const taskId = task.id;

        const insertMessages = await this.db.Message.create(
          {
            send_to: receiptId,
            task_id: taskId,
            accept: "pending",
          },
          { transaction }
        );
      }

      await transaction.commit();
      response.redirect("/projects");
    } catch (err) {
      console.error(err);
      if (err.message === "email is invalid") {
        await transaction.rollback();
      }
    }
  };

  getUserProjects = async (request, response) => {
    try {
      const { navbar, userId } = request;
      const { completedSortBy } = request.query;
      const { pendingSortBy } = request.query;

      const unsortedcompletedProj = await this.db.Project.findAll({
        where: {
          created_by: userId,
          status: "completed",
        },
      });
      const unsortedpendingProj = await this.db.Project.findAll({
        where: {
          created_by: userId,
          status: "pending",
        },
      });

      const pendingProj = dynamicSort(pendingSortBy, unsortedpendingProj);
      const completedProj = dynamicSort(completedSortBy, unsortedcompletedProj);

      response.render("projects", { pendingProj, completedProj, navbar });
    } catch (err) {
      console.error(err);
    }
  };

  editProjectForm = async (request, response) => {
    try {
      const projId = Number(request.params.id);
      const { navbar } = request;
      const tasks = await this.db.Task.findAll({
        where: {
          proj_id: projId,
        },
      });

      console.log(tasks);
      const updatedTasks = [];

      //for each is a function but cannot be used with aync, so have to use with for loop
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const receiptId = task.assigned_to;
        const users = await this.db.User.findByPk(receiptId);
        const user = users.toJSON();
        task.user_email = user.email;
        task.formatdate = moment(tasks[i].due_date).format("YYYY-MM-DDTHH:MM");
        updatedTasks.push(task);
      }

      const project = await this.db.Project.findByPk(projId);
      const proj = project.toJSON();
      proj.formatdate = moment(proj.due_date).format("YYYY-MM-DDTHH:MM");
      response.render("editproject", { proj, tasks: updatedTasks, navbar });
    } catch (err) {
      console.error(err);
    }
  };

  editProject = async (request, response) => {
    try {
      const { userId } = request;
      const user = request.body;
      const projId = request.params.id;
      const [name, description, duedate, ...tasks] = Object.values(user);
      const fomattedDueDate = moment(duedate).format("DD MMM YYYY hh:mm");

      await this.db.Project.update(
        {
          name: name,
          description: description,
          due_date: fomattedDueDate,
          updated_at: Date.now(),
        },
        {
          where: {
            id: projId,
          },
        }
      );

      const slicedArray = sliceForEdit(tasks);
      for (let i = 0; i < slicedArray.length; i++) {
        const chunk = slicedArray[i];
        const [taskId, taskName, taskduedate, email] = chunk;
        const formattedTDueDate = moment(taskduedate).format(
          "DD MMM YYYY hh:mm"
        );

        const getUsers = await this.db.User.findOne({
          where: {
            email: email,
          },
        });

        const user = getUsers.toJSON();
        const receiptId = Number(user.id);

        if (taskId === "") {
          const insertTask = await this.db.Task.create({
            name: taskName,
            due_date: formattedTDueDate,
            accepted: "no",
            status: "pending",
            proj_id: projId,
            created_by: userId,
            assigned_to: receiptId,
          });

          const newTask = insertTask.toJSON();
          const newTaskId = newTask.id;

          await this.db.Message.create({
            send_to: receiptId,
            task_id: newTaskId,
            accept: "pending",
          });
        } else {
          await this.db.Task.update(
            {
              name: taskName,
              due_date: formattedTDueDate,
              assigned_to: receiptId,
              proj_id: projId,
              updated_at: Date.now(),
            },
            {
              where: {
                id: taskId,
              },
            }
          );

          await this.db.Message.update(
            {
              send_to: receiptId,
              accept: "pending",
            },
            {
              where: {
                task_id: taskId,
              },
            }
          );
        }
      }

      response.redirect(`/projects/${projId}`);
    } catch (err) {
      console.error(err);
    }
  };

  deleteProject = async (request, response) => {
    try {
      const projId = Number(request.params.id);
      const tasks = await this.db.Task.findAll({
        where: {
          proj_id: projId,
        },
      });

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const taskId = task.id;

        await this.db.Task.destroy({
          where: {
            id: taskId,
          },
        });

        await this.db.Message.destroy({
          where: {
            task_id: taskId,
          },
        });
      }

      await this.db.Project.destroy({
        where: {
          id: projId,
        },
      });

      response.redirect("/projects/");
    } catch (err) {
      console.error(err);
    }
  };

  getOneUserProject = async (request, response) => {
    try {
      const projId = Number(request.params.id);
      const { navbar } = request;

      const proj = await this.db.Project.findByPk(projId);
      const project = proj.toJSON();
      const tasks = await this.db.Task.findAll({
        where: {
          proj_id: projId,
        },
        include: {
          model: this.db.User,
          as: "assignedTo",
        },
      });

      response.render("individualproj", {
        proj: project,
        tasks: tasks,
        navbar,
      });
    } catch (err) {
      console.error(err);
    }
  };
}

export default ProjectController;
