const Discord = require("discord.js");
const config = require("./config.json");

const { Client, MessageEmbed } = require('discord.js');

const client = new Discord.Client();

var mysql = require('mysql');

var con = mysql.createConnection({
  host: config.MYSQLHOST,
  port: config.MYSQLPORT,
  user: config.MYSQLUSER,
  password: config.MYSQLPASSWORD,
  database: config.MYSQLDATABASE
});

con.connect(function(err) {
  if (err) throw err;
  console.log("MySQL connected!")
});

con.query('SET lc_time_names = "fr_FR";', function (error, results, fields) {
  if (error) throw error;
  console.log(results.insertId);
});

client.on("ready", () => {
  client.user.setActivity('!help', { type: 'PLAYING' });
});

client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.PREFIX)) return;

  const commandBody = message.content.slice(config.PREFIX.length);
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
        { name: '!ping', value: 'Affiche le ping du bot.', inline: false },
        //{ name: 'Inline field title', value: 'Some value here', inline: true },
        { name: '!devoir', value: 'Affiche la liste des devoirs qui sont à venir.', inline: false },
        { name: '!newDevoir [nom du devoir] [matière] [date rendu]', value: 'enregistre un nouveau devoir à venir.', inline: false },
      )
      //.addField('Inline field title', 'Some value here', true)
      .setImage('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      .setTimestamp()
      .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
      message.author.send(embed);
  }

  else if (command == "newdevoir") {
    const args = message.content.slice(config.PREFIX.length).trim().split(' ');

    if (args.length == 1) {
      return message.reply(`Tu n'as pas donné d'arguments !`);
    }

    else if (args.length != 4) {
      return message.reply(`Le(s) argument(s) sont incorrect(s) !`);
    }

    else if (!args[3].match(/([12]\d{3}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01]))/)) {
      return message.reply(`Le format de la date est incorrect ! (YYYY/MM/DD)`);
    }

    else {
      con.query('INSERT INTO devoirs (name, subject, date) VALUES ("' + args[1] + '", "' + args[2] + '", "' + args[3] + '");', function (error, results, fields) {
        if (error) throw error;
        console.log(results.insertId);
      });
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
      //.setImage('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      .setTimestamp()
      .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
      message.reply(embed);
    }
  }

  else if (command === "devoir" || command === "devoirs") {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '1'); //January is 1!
    var yyyy = today.getFullYear();

    con.query('SELECT name, subject, date_format(date, "%W %d %M %Y (%d/%m/%Y)") AS formatedDate FROM devoirs WHERE date >= "' + today + '" ORDER BY date;', function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      const embed = new MessageEmbed()
      // Set the title of the field
      .setTitle(`Liste des devoirs`)
      // Set the color of the embed
      .setColor(0x0000FF)
      .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      // Set the main content of the embed
      .setDescription('La liste des devoirs à venir :')
      //.setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      results.forEach(element => {
        embed.addFields(
          { name: '__', value: "**" + element.name + "**" },
          //{ name: '\u200B', value: '\u200B' },
          //{ name: '!ping', value: 'Affiche le ping du bot.', inline: true },
          //{ name: 'Inline field title', value: 'Some value here', inline: true },
        )
        .addField('> Matière :', element.subject, true)
        .addField('> Date de rendu :', element.formatedDate, true)
      });
      //.addField('Inline field title', 'Some value here', true)
      //embed.setImage('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
      embed.setTimestamp()
      .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
      message.reply(embed);
    });
  }

  else {
    message.reply("**\\*bip\\*** Je suis désolé. **\\*bip\\*** La commande n'existe pas (ou pas encore). **\\*bip\\***");
  }
});

client.login(config.BOT_TOKEN);