const Discord = require("discord.js");
const config = require("./config.json");

const { Client, MessageEmbed } = require('discord.js');

const client = new Discord.Client();

var mysql = require("mysql");

/*
var con = mysql.createConnection({
  host: "193.xxx.xxx.xxx",
  user: "discord",
  password: "password",
  database: "gu_discord"
})

con.connect(function(err) {
  if (err) throw err;
  console.log("MySQL connected!")
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
});

client.login(config.BOT_TOKEN);