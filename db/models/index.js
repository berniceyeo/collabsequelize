/* eslint-disable comma-dangle */
import sequelizePackage from 'sequelize';
import allConfig from '../../sequelize.config.cjs';

import initMessageModel from './message.mjs';
import initTaskModel from './task.mjs';
import initUserModel from './user.mjs';
import initProjectModel from './project.mjs';
import initFriendModel from './friend.mjs';

const { Sequelize } = sequelizePackage;
const env = process.env.NODE_ENV || 'development';
const config = allConfig[env];
const db = {};

// initiate a new instance of Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// here we are putting initModel from model.mjs into the object "db" (line 14)
db.Message = initMessageModel(sequelize, Sequelize.DataTypes);
db.Task = initTaskModel(sequelize, Sequelize.DataTypes);
db.User = initUserModel(sequelize, Sequelize.DataTypes);
db.Project = initProjectModel(sequelize, Sequelize.DataTypes);
db.Friend = initFriendModel(sequelize, Sequelize.DataTypes);

/** MAIN TABLES */
/** One to one relationship between A and B with foreign key defined in A. */
/** One to one relationship between A and B with foreign key defined in B. */

//Both the hasOne and belongsTo calls shown above will infer that the foreign key to be created should be called fooId. To use a different name, such as myFooId
db.Project.belongsTo(db.User, { foreignKey: 'created_by'});
db.User.hasMany(db.Project, { foreignKey: 'created_by'});

db.Task.belongsTo(db.Project, { foreignKey: 'proj_id'});
db.Project.hasMany(db.Task, { foreignKey: 'proj_id'});

db.Task.belongsTo(db.User, { as: 'createdBy', foreignKey: 'created_by' });
db.Task.belongsTo(db.User, { as: 'assignedTo', foreignKey: 'assigned_to' });
db.User.hasMany(db.Task,  { as: 'createdBy', foreignKey: 'created_by' });
db.User.hasMany(db.Task, { as: 'assignedTo', foreignKey: 'assigned_to' });

db.User.hasMany(db.Friend, {as: 'user', foreignKey:'user_id'});
db.User.hasMany(db.Friend, {as: 'friends', foreignKey: 'friend_id'});
db.Friend.belongsTo(db.User, {as: 'user', foreignKey:'user_id'})
db.Friend.belongsTo(db.User, {as: 'friends', foreignKey: 'friend_id'})

db.User.belongsToMany(db.Task, { through: db.Message });
db.Task.belongsToMany(db.User, { through: db.Message });

db.Task.hasMany(db.Message);
db.Message.belongsTo(db.Task);
db.User.hasMany(db.Message, {as: 'sendTo', foreignKey: 'send_to'});
db.Message.belongsTo(db.User, {as: 'sendTo', foreignKey: 'send_to'});

// here we are putting the instance we created in line 28 into the object "db"
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
