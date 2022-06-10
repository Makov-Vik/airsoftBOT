const dotenv = require('dotenv');
const env = require('env-var');
const TelegramBot = require('node-telegram-bot-api');
const { User, Team } = require('./db-init');
dotenv.config();

const TOKEN = env.get('TOKEN').required().asString();
const bot = new TelegramBot(TOKEN, {polling: true});

bot.setMyCommands([
  { command: '/start', description: 'start working'},
  {command: '/registration', description: 'registrate to service'},
  { command: '/see_teams', description: 'see all teams'},
  { command: '/join_team', description: 'join to team'},
]);


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Hi there 👋\nGlad to see you, ${msg.from.first_name}`);
});

// for player
bot.onText(/\/registration/, async (msg) => {
  checkUser = await User.findOne({ where: { id: msg.from.id }});
  if(checkUser) {
    bot.sendMessage(msg.chat.id, 'Oy, man\nYou are already registered');
  } else {
    await User.create({ id: msg.from.id, name: msg.from.first_name, ban: false, banReason: '' });
    bot.sendMessage(msg.chat.id, 'Welcome, to community');
  };
});

bot.onText(/\/see_teams/, async (msg) => {
  try {
    const teamsFromDB = await Team.findAll();
    let strTeams = '';
    teamsFromDB.forEach((item) => {
      strTeams = strTeams + 
      `team: ${item.getDataValue('name')}\ndescription: ${item.getDataValue('description')}\nhead Manager: ${item.getDataValue('headManager')}\n\n`;

    })
    bot.sendMessage(msg.chat.id, `${strTeams}`)    
  } catch (_e) {
    bot.sendMessage(msg.chat.id, 'something was wrong');
  }

});

bot.onText(/\/join_team/, async (msg) => {

});


// for manager
bot.onText(/\/create_team/, async (msg) => {
  bot.sendMessage(msg.chat.id, 'okay, send me data like this: \nexampleTeamName, description of this team');

  bot.on('message', async (msg) => {
    const teamDate = msg.text.split(',');
    console.log(teamDate);
    const applicant = await Team.findOne({ where: { name: teamDate[0] }});
    if (applicant) {
      bot.sendMessage(msg.chat.id, 'sorry, but this name already taken');
    } else {
      try {
        await Team.create({ name: teamDate[0], description: teamDate[1].trim(), headManager: msg.from.id });
        bot.sendMessage(msg.chat.id, 'good job\nteam was created');        
      } catch (_e) {
        bot.sendMessage(msg.chat.id, 'something was wrong');
      }

    }
  });
});