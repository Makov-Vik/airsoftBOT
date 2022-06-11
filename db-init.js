const dotenv = require('dotenv');
const env = require('env-var');
const { Sequelize } = require('sequelize');
const { TYPE, STATUS } = require('./constatns');
dotenv.config();


const database = env.get('POSTGRES_DB').required().asString();
const user = env.get('POSTGRES_USER').required().asString();
const password = env.get('POSTGRES_PASSWORD').required().asString();
const host = env.get('POSTGRES_HOST').required().asString();
const port = env.get('POSTGRES_PORT').required().asIntPositive();

const sequelize = new Sequelize(database, user, password, {
  host,
  dialect: 'postgres',
});


const User = sequelize.define("user", {
  name: { type: Sequelize.STRING },
  ban: { type: Sequelize.BOOLEAN, defaultValue: false },
  role: { type: Sequelize.STRING },
  chatId : { type: Sequelize.INTEGER }

}, { freezeTableName: true });

const Team = sequelize.define("team", {
  name: { type: Sequelize.STRING, unique: true },
  description: { type: Sequelize.STRING },
  headManager: { type: Sequelize.INTEGER},
  users: {type: Sequelize.ARRAY(Sequelize.INTEGER)}

}, { freezeTableName: true });

const Request = sequelize.define("request", {
  from: { type: Sequelize.INTEGER },
  to: { type: Sequelize.INTEGER },
  type: { type: Sequelize.STRING },
  status: {type: Sequelize.STRING }
}, { freezeTableName: true });

sequelize.sync({ alter: true });

module.exports = { User, Team, Request };