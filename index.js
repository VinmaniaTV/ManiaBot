const Discord = require("discord.js");
const config = require("./config.json");

const { Client, MessageEmbed } = require('discord.js');

const client = new Discord.Client();

var mysql = require('mysql');

/*
var con = mysql.createConnection({
  host: 'db5000977005.hosting-data.io',
  port: 3306,
  user: 'dbu1246470',
  password: 'M@n1aBotPassword',
  database: 'dbs849196'
});

con.connect(function(err) {
  if (err) throw err;
  console.log("MySQL connected!")
});
*/

client.on("ready", () => {
  client.user.setActivity('!help', { type: 'PLAYING' });
});

const prefix = "!";

client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! Ce message a une latence de ${timeTaken}ms.`);
  }

  else if (command === "sum") {
    const numArgs = args.map(x => parseFloat(x));
    const sum = numArgs.reduce((counter, x) => counter += x);
    message.reply(`The sum of all the arguments you provided is ${sum}!`);
  }

  else if (command === "help") {
// We can create embeds using the MessageEmbed constructor
    // Read more about all that you can do with the constructor
    // over at https://discord.js.org/#/docs/main/master/class/MessageEmbed
    const embed = new MessageEmbed()
      // Set the title of the field
      .setTitle('!help')
      // Set the color of the embed
      .setColor(0x0000FF)
      .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      // Set the main content of the embed
      .setDescription('Liste des commandes actives :')
      .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      .addFields(
        { name: '!help', value: 'Affiche ce message en message privé.' },
        //{ name: '\u200B', value: '\u200B' },
        { name: '!ping', value: 'Affiche le ping du bot.', inline: true },
        //{ name: 'Inline field title', value: 'Some value here', inline: true },
      )
      //.addField('Inline field title', 'Some value here', true)
      .setImage('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      .setTimestamp()
      .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
      message.author.send(embed);
  }

  else if (command == "newdevoir") {
    const args = message.content.slice(prefix.length).trim().split(' ');

    if (args.length == 1) {
      return message.reply(`Tu n'as pas donné d'arguments !`);
    }

    else if (args.length != 4) {
      return message.reply(`Le(s) argument(s) sont incorrect(s) !`);
    }

    else if (!args[3].match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
      return message.reply(`Le format de la date est incorrect ! (YYYY-MM-DD)`);
    }

    else {
      /*
      connection.query('INSERT INTO devoirs (name, subject, date) VALUES (' + args[1] + ', ' + args[2] + ', ' + args[3] ');', function (error, results, fields) {
        if (error) throw error;
        console.log(results.insertId);
      });
      */
      const embed = new MessageEmbed()
      // Set the title of the field
      .setTitle(`Ajout d'un devoir`)
      // Set the color of the embed
      .setColor(0x0000FF)
      .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      // Set the main content of the embed
      .setDescription('Le devoir a bien été ajouté avec informations suivantes :')
      .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      .addFields(
        { name: 'Nom du devoir :', value: args[1] },
        //{ name: '\u200B', value: '\u200B' },
        //{ name: '!ping', value: 'Affiche le ping du bot.', inline: true },
        //{ name: 'Inline field title', value: 'Some value here', inline: true },
      )
      .addField('Matière :', args[2], true)
      .addField('Date de rendu :', args[3], true)
      //.addField('Inline field title', 'Some value here', true)
      .setImage('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      .setTimestamp()
      .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
      message.reply(embed);
    }
  }
});

client.login(config.BOT_TOKEN);