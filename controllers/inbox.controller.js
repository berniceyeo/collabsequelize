import addSentProperty from '../helperfunctions/addSent.js';
import dynamicSort from '../helperfunctions/sorting.js';

class InboxController {
  constructor(db) {
    this.db = db;
  }

  getInbox = async (request, response) => {
    try {
      const { navbar, userId } = request;
      const { sortBy } = request.query;
      
      const preReceivedTasks = await this.db.Message.findAll({
        where:{
          send_to: userId
        },
        include: {
          model: this.db.Task,
          include: [{
            model: this.db.User,
            as: 'createdBy'
          }, {
            model: this.db.User,
            as:'assignedTo'
          }]
        },
      });
      
      const receivedTasks = addSentProperty(preReceivedTasks, 'received');

      const preSentTasks = await this.db.Message.findAll({
        include: {
          model: this.db.Task,
          where:{
            created_by: userId
          },
          include: [{
            model: this.db.User,
            as: 'createdBy'
          }, {
            model: this.db.User,
            as:'assignedTo'
          }]
        },
      });

      const sentTasks = addSentProperty(preSentTasks, 'sent');
      const pretotalTasks = [...receivedTasks, ...sentTasks];
      const sortedTotalTasks = dynamicSort(sortBy, pretotalTasks);
      const totalTasks = sortedTotalTasks.map((task) => task.dataValues)

      response.render('inbox', {
        totalTasks, navbar, inboxId: userId,
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default InboxController;
