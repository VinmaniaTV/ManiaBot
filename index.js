const Discord = require("discord.js");
const config = require("./config.json");
const ytdl = require("ytdl-core");
const https = require('https');

const { Client, MessageEmbed } = require('discord.js');

const client = new Discord.Client();

const queue = new Map();

var mysql = require('mysql');

var con = mysql.createConnection({
  host: config.MYSQLHOST,
  port: config.MYSQLPORT,
  user: config.MYSQLUSER,
  password: config.MYSQLPASSWORD,
  database: config.MYSQLDATABASE
});

con.connect({timeout: Infinity}, function(err) {
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

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.PREFIX)) return;

  const serverQueue = queue.get(message.guild.id);

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
        { name: '!edt', value: 'Affiche l\'emploi du temps de la semaine. **[BETA]**', inline: false },
        { name: '!devoir', value: 'Affiche la liste des devoirs qui sont à venir.', inline: false },
        { name: '!newDevoir [nom du devoir] [matière] [date rendu]', value: 'Enregistre un nouveau devoir à venir.', inline: false },
        { name: '!play [lien YouTube]', value: 'Ajoute une musique à la liste d\'attente.', inline: false },
        { name: '!skip', value: 'Passe la musique actuellement jouée par ManiaBot.', inline: false },
        { name: '!stop', value: 'Arrête la musique.', inline: false },
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
      )
      .addField('Matière :', args[2], true)
      .addField('Date de rendu :', args[3], true)
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
      results.forEach(element => {
        embed.addFields(
          { name: '__', value: "**" + element.name + "**" },
        )
        .addField('> Matière :', element.subject, true)
        .addField('> Date de rendu :', element.formatedDate, true)
      });
      embed.setTimestamp()
      .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
      message.reply(embed);
    });
  }

  // Music Bot commands.

  else if (command === `play`) {
    execute(message, serverQueue);
    return;
  }
  
  else if (command === `skip`) {
    skip(message, serverQueue);
    return;
  }
  
  else if (command === `stop`) {
    stop(message, serverQueue);
    return;
  }

  // Calendar Commands.

  else if (command === "edt") {
    var weekday = new Array(7);
    weekday[0] = "Dimanche";
    weekday[1] = "Lundi";
    weekday[2] = "Mardi";
    weekday[3] = "Mercredi";
    weekday[4] = "Jeudi";
    weekday[5] = "Vendredi";
    weekday[6] = "Samedi";

    let req = https.get(config.CALENDAR, function(res) {
      let data = '',
        calendar,
        calendar_week = [];

      res.on('data', function(stream) {
        data += stream;
      });
      res.on('end', function() {
        calendar = JSON.parse(data);
        // will output a Javascript object

        calendar.items.forEach(element => {
          calendar_week.push(element);
        });

        var len = calendar.length;
        for (var i = len-1; i>=0; i--){
          for(var j = 1; j<=i; j++){
            if(calendar_week[j-1].start.dateTime>calendar_week[j].start.dateTime){
              var temp = calendar_week[j-1];
              calendar_week[j-1] = calendar_week[j];
              calendar_week[j] = temp;
            }
          }
        }

        console.log(calendar_week);

        // We can create embeds using the MessageEmbed constructor
        // Read more about all that you can do with the constructor
        // over at https://discord.js.org/#/docs/main/master/class/MessageEmbed
        const embed = new MessageEmbed()
        // Set the title of the field
        .setTitle('Emploi du temps')
        // Set the color of the embed
        .setColor(0x0000FF)
        .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
        .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
        for (var i = 1; i < weekday.length; i++) {
          var strCal = "";
          calendar_week.forEach(element => {
            if (new Date(element.start.dateTime).getWeek() == new Date().getWeek()) {
              if (weekday[new Date(element.start.dateTime).getDay()] == weekday[i]) {
                strCal += new Date(element.start.dateTime).getHours() + ":" + new Date(element.start.dateTime).getMinutes() +  ' - ' + new Date(element.end.dateTime).getHours() + ":" + new Date(element.end.dateTime).getMinutes() + "\t|\t" + element.summary + "\n"
              }
            }
          })
          if (strCal == "") {
            strCal += "Rien de prévu " + weekday[i] + " !";
          }
          embed.addField("**" + weekday[i] + "**", "```" + strCal + "```") 
        };
        /*
        calendar_week.items.forEach(element => {
          if (new Date(element.start.dateTime).getWeek() == new Date().getWeek()) {
            embed.addFields(
              { name: '__', value: "**" + element.summary + "**" },
            )
            .addField(element.description, element.location, true)
            .addField(new Date(element.start.dateTime).getHours() + ":" + new Date(element.start.dateTime).getMinutes()+  ' - ' + new Date(element.end.dateTime).getHours() + ":" + new Date(element.end.dateTime).getMinutes(), "__")
          }
        });
        */
        embed.setTimestamp()
        .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
        message.reply(embed);
      });
    });

    req.on('error', function(e) {
        console.log(e.message);
    });
  }

  else {
    message.reply("**\\*bip\\*** Je suis désolé. **\\*bip\\*** La commande n'existe pas (ou pas encore). **\\*bip\\***");
  }
});

// Music Bot methods.

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Connecte-toi dans un salon vocal !"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Je n'ai pas la permission de rejoindre ton salon ou d'y parler ! :("
    );
  }

  if (args.length < 2) {
    return message.channel.send(
      "Il me faut le lien de ta musique pour que je puisse la jouer ! ♫"
    );
  }

  if (args.length > 2) {
    return message.channel.send(
      "Doucement ! Donne moi une seule musique à la fois !"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} a été ajouté à la liste d'attente !`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Tu dois être dans un salon vocal pour passer la musique !"
    );
  if (!serverQueue)
    return message.channel.send("Il n'y a aucun son à passer !");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Tu dois être dans un salon vocal pour arrêter la musique !"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
  .play(ytdl(song.url))
  .on("finish", () => {
    serverQueue.songs.shift();
    play(guild, serverQueue.songs[0]);
  })
  .on("error", error => console.error(error));
dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
serverQueue.textChannel.send(`Lecture de : **${song.title}**`);
}

// Calendar Methods.

Date.prototype.getWeek = function (dowOffset) {
  /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */
  
      dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
      var newYear = new Date(this.getFullYear(),0,1);
      var day = newYear.getDay() - dowOffset; //the day of week the year begins on
      day = (day >= 0 ? day : day + 7);
      var daynum = Math.floor((this.getTime() - newYear.getTime() - 
      (this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
      var weeknum;
      //if the year starts before the middle of a week
      if(day < 4) {
          weeknum = Math.floor((daynum+day-1)/7) + 1;
          if(weeknum > 52) {
              nYear = new Date(this.getFullYear() + 1,0,1);
              nday = nYear.getDay() - dowOffset;
              nday = nday >= 0 ? nday : nday + 7;
              /*if the next year starts before the middle of
                the week, it is week #1 of that year*/
              weeknum = nday < 4 ? 1 : 53;
          }
      }
      else {
          weeknum = Math.floor((daynum+day-1)/7);
      }
      return weeknum;
  };

client.login(config.BOT_TOKEN);