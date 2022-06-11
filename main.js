const dotenv = require('dotenv');
const env = require('env-var');
const TelegramBot = require('node-telegram-bot-api');
const { User, Team, Request } = require('./db-init');
const { ROLE, TYPE, STATUS } = require('./constatns');
const { acceptDeclineOptions } = require('./options')
dotenv.config();

const TOKEN = env.get('TOKEN').required().asString();
const bot = new TelegramBot(TOKEN, {polling: true});


const checkRole = async(userId, role) => {
  const user = await User.findOne({ where: { id: userId }});
  if (user.role === role) {
    return true
  }
  return false;
}

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
    await User.create({ 
      id: msg.from.id,
      name: msg.from.first_name,
      ban: false,
      role: ROLE[ROLE.indexOf('PLAYER')],
      chatId: msg.chat.id
    });
    bot.sendMessage(msg.chat.id, 'Welcome, to community');
  };
});

bot.onText(/\/see_teams/, async (msg) => {
  const teamsFromDB = await Team.findAll({attributes: ['name', 'description', 'headManager']});
  try {
    if (teamsFromDB.length === 0) {
      return bot.sendMessage(msg.chat.id, "there isn't teams yet");
    }
    let strTeams = '';
    teamsFromDB.forEach((item) => {
      strTeams = strTeams + 
      `team: ${item.getDataValue('name')}\ndescription: ${item.getDataValue('description')}\n\n`;

    })
    return bot.sendMessage(msg.chat.id, `${strTeams}`);
  } catch (e) {
    return bot.sendMessage(msg.chat.id, 'something was wrong');
  }

});

bot.onText(/\/join_team/, async (msg) => {
  bot.sendMessage(msg.chat.id, 'ok send me the team name');
  bot.on('message', async function joinTeam(msg) {
    const teamName = msg.text;
    const applicant = await Team.findOne({ where: { name: teamName }});
    if (applicant) {
      try {
        const manager = await User.findOne({ where: { id: applicant.headManager }});
        const request = {
          from: msg.from.id,
          to: applicant.headManager,
          type: TYPE[TYPE.indexOf('JOIN')],
          status: STATUS[STATUS.indexOf('PENDING')]
        };
        checkExistReq = Request.findOne({ where: request })
        if (!checkExistReq) {
          bot.sendMessage(manager.chatId, `new request to join team ${teamName} from ${msg.from.first_name} id: ${msg.from.id} \nrequest: ${request.id}`, acceptDeclineOptions);
          bot.sendMessage(msg.chat.id, 'good job\nrequest was sending');
        } else {
          bot.sendMessage(msg.chat.id, 'you have already sent a request');
        }
      } catch (_e) {
        bot.sendMessage(msg.chat.id, 'something was wrong');
      }
    } else {
      bot.sendMessage(msg.chat.id, 'sorry, but this name does not exist');
    };

    bot.removeListener("message", joinTeam);
  });
});


// for manager
bot.onText(/\/create_team/, async (msg) => {
  if (!await checkRole(msg.from.id, ROLE[ROLE.indexOf('MANAGER')])) {
    return bot.sendMessage(msg.chat.id, 'you have no access');
  }
  bot.sendMessage(msg.chat.id, 'okay, send me data like this: \nexampleTeamName, description of this team');

  bot.on('message', async function createTeam(msg) {
    const teamDate = msg.text.split(',');
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
      bot.removeListener("message", createTeam);
    };
  });      

});


bot.on('callback_query', async (msg) => {
  const data = msg.data;
  const requestId = msg.message.text.split('request: ')[1];
  const playerId = msg.message.text.split(' ')[9];
  const teamName = msg.message.text.split(' ')[5];
  const requestType =  msg.message.text.split(' ')[3];
  const team = await Team.findOne({ where: { name: teamName}});
  const player = await User.findOne({ where: { id: playerId }});
  let users ;
    try {
      switch(data) {
        case ('0'): {
          const checkPlayerOnTeam = await Team.findOne({ attributes: ['users'], where: { name: teamName }});
          if (checkPlayerOnTeam.users.includes(Number(playerId))) {
            bot.sendMessage(msg.message.chat.id, 'this player is already in the team');
            break;
          }
          await Request.update({ status: STATUS[data]}, { where: { id: requestId }});
          users = team.getDataValue('users') || [];
          users.push(playerId);
          await Team.update({ users: users }, { where: { name: team.name }});
          bot.sendMessage(msg.message.chat.id, 'operation success');
          bot.sendMessage(player.chatId, `your request to ${requestType} ${teamName} was ${STATUS[data]}`);
          break;
        }

        case('1'): {
          await Request.update({ status: STATUS[data]}, { where: { id: requestId }});
          bot.sendMessage(msg.message.chat.id, 'operation success');
          break;
        }
      }
    } catch (_e) {
      bot.sendMessage(msg.message.chat.id, 'something was wrong');
    };
});