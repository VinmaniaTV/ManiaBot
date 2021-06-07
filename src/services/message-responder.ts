import { Message, MessageEmbed } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Music } from "./music"; 
import { get } from "https";
import { League } from "./league";
import { Osu } from "./osu";
import { Connection, createConnection } from "mysql";

@injectable()
export class MessageResponder {
    private league: League;
    private osu: Osu;
    private readonly prefix: string;
    private readonly calendar: string;
    private readonly mysqlHost: string;
    private readonly mysqlPort: number;
    private readonly mysqlUser: string;
    private readonly mysqlPassword: string;
    private readonly mysqlDatabase: string;
    private con: Connection;

    constructor(
        @inject(TYPES.League) league: League,
        @inject(TYPES.Osu) osu: Osu,
        @inject(TYPES.Prefix) prefix: string,
        @inject(TYPES.Calendar) calendar: string,
        @inject(TYPES.MysqlHost) mysqlHost: string,
        @inject(TYPES.MysqlPort) mysqlPort: number,
        @inject(TYPES.MysqlUser) mysqlUser: string,
        @inject(TYPES.MysqlPassword) mysqlPassword: string,
        @inject(TYPES.MysqlDatabase) mysqlDatabase: string
    ) {
        this.league = league;
        this.osu = osu;
        this.prefix = prefix;
        this.calendar = calendar;
        this.con = createConnection({
            host: this.mysqlHost,
            port: this.mysqlPort,
            user: this.mysqlUser,
            password: this.mysqlPassword,
            database: this.mysqlDatabase
        });
    }

    public SQLConnect() {
        this.con.connect({ timeout: Infinity }, function(err) {
            if (err) throw err;
            console.log("MySQL connected!")
        });
    
        this.con.query('SET lc_time_names = "fr_FR";', function(error, results, fields) {
            if (error) throw error;
            console.log(results.insertId);
        });
    }

    async handle(message: Message, music: Music): Promise<Message | Message[]> {

        const commandBody = message.content.slice(this.prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        // if (this.pingFinder.isPing(message.content)) {
        //     const timeTaken = Date.now() - message.createdTimestamp;
        //     return message.reply(`Pong! ${timeTaken}ms.`);
        // }

        if (command === "ping") {
            const timeTaken = Date.now() - message.createdTimestamp;
            return message.reply(`Pong! ${timeTaken}ms.`);
        }

        else if (command === "sum") {
            const numArgs = args.map(x => parseFloat(x));
            const sum = numArgs.reduce((counter, x) => counter += x);
            return message.reply(`The sum of all the arguments you provided is ${sum}!`);
        }

        else if (command === "help") {
            // We can create embeds using the MessageEmbed constructor
            // Read more about all that you can do with the constructor
            // over at https://discord.js.org/#/docs/main/master/class/MessageEmbed
            const embed = new MessageEmbed()
                // Set the title of the field
                .setTitle('/help')
                // Set the color of the embed
                .setColor(0x0000FF)
                .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                // Set the main content of the embed
                .setDescription('Liste des commandes actives :')
                .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                .addFields({ name: '/help', value: 'Affiche ce message en message privé.' },
                    //{ name: '\u200B', value: '\u200B' },
                    { name: '/ping', value: 'Affiche le ping du bot.', inline: false },
                    //{ name: 'Inline field title', value: 'Some value here', inline: true },
                    { name: '/edt', value: 'Affiche l\'emploi du temps de la semaine. **[BETA]**', inline: false }, { name: '/devoir', value: 'Affiche la liste des devoirs qui sont à venir.', inline: false }, { name: '/newDevoir [nom du devoir] [matière] [date rendu]', value: 'Enregistre un nouveau devoir à venir.', inline: false }, { name: '/play [lien YouTube]|[nom du son]', value: 'Ajoute une musique à la liste d\'attente.', inline: false }, { name: '/skip', value: 'Passe la musique actuellement jouée par ManiaBot.', inline: false }, { name: '/stop', value: 'Arrête la musique.', inline: false }, { name: '/join', value: 'Déplace le bot dans le salon vocal où l\'utilisateur se trouve (ne marche que si le bot joue une musique).', inline: false }, { name: '/league [nom d\'invocateur]', value: 'Affiche les infos de base de l\'invocateur spécifié.', inline: false }, { name: '/osu [nom d\'utilisateur]', value: 'Affiche les infos de base du joueur spécifié sur Osu!', inline: false }, { name: '/pf', value: 'Pile ou face.', inline: false }, { name: '/rdm [noms]', value: 'Entrez des noms séparés d\'un espace et un seul sera retourné au hasard.', inline: false },
                )
                //.addField('Inline field title', 'Some value here', true)
                .setImage('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                .setTimestamp()
                .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
            return message.author.send(embed);
        }

        else if (command == "newdevoir") {
            const args = message.content.slice(this.prefix.length).trim().split(' ');

            if (args.length == 1) {
                return message.reply(`Tu n'as pas donné d'arguments !`);
            } else if (args.length != 4) {
                return message.reply(`Le(s) argument(s) sont incorrect(s) !`);
            } else if (!args[3].match(/([12]\d{3}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01]))/)) {
                return message.reply(`Le format de la date est incorrect ! (YYYY/MM/DD)`);
            } else {
                this.SQLConnect();
                this.con.query('INSERT INTO devoirs (name, subject, date) VALUES ("' + args[1] + '", "' + args[2] + '", "' + args[3] + '");', function (error, results, fields) {
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
                    .addFields({ name: 'Nom du devoir :', value: args[1] },)
                    .addField('Matière :', args[2], true)
                    .addField('Date de rendu :', args[3], true)
                    .setTimestamp()
                    .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
                this.con.end();
                return message.reply(embed);
            }
        } else if (command === "devoir" || command === "devoirs") {
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '1'); //January is 1!
            var yyyy = today.getFullYear();

            this.SQLConnect();
            this.con.query('SELECT name, subject, date_format(date, "%W %d %M %Y (%d/%m/%Y)") AS formatedDate FROM devoirs WHERE date >= "' + yyyy + '-' + mm + '-' + dd + '" ORDER BY date;', function (error, results, fields) {
                if (error) throw error;
                console.log(results);
                const embed = new MessageEmbed()
                    .setTitle(`Liste des devoirs`)
                    .setColor(0x0000FF)
                    .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                    .setDescription('La liste des devoirs à venir :')
                results.forEach(element => {
                    embed.addFields({ name: '__', value: "**" + element.name + "**" },)
                        .addField('> Matière :', element.subject, true)
                        .addField('> Date de rendu :', element.formatedDate, true)
                });
                embed.setTimestamp()
                    .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
                this.con.end();
                return message.reply(embed);
            });
        }
        
        // Music Bot commands.
        else if (command === `play`) {
            music.execute(message);
            return;
        } else if (command === `skip`) {
            music.skip(message);
            return;
        } else if (command === `stop`) {
            music.stop(message);
            return;
        } else if (command === 'join') {
            music.joinVocal(message);
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
            console.log(this.calendar);

            let req = get(this.calendar, function (res) {
                let data = '',
                    calendar,
                    calendar_week = [];

                res.on('data', function (stream) {
                    data += stream;
                });
                res.on('end', function () {
                    calendar = JSON.parse(data);
                    // will output a Javascript object

                    calendar.items.forEach(element => {
                        calendar_week.push(element);
                    });

                    var len = calendar.length;
                    for (var i = len - 1; i >= 0; i--) {
                        for (var j = 1; j <= i; j++) {
                            if (calendar_week[j - 1].start.dateTime > calendar_week[j].start.dateTime) {
                                var temp = calendar_week[j - 1];
                                calendar_week[j - 1] = calendar_week[j];
                                calendar_week[j] = temp;
                            }
                        }
                    }

                    const embed = new MessageEmbed()
                        .setTitle('Emploi du temps')
                        .setColor(0x0000FF)
                        .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                        .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                    for (var i = 1; i < weekday.length; i++) {
                        var strCal = "";
                        calendar_week.forEach(element => {
                            if (new Date(element.start.dateTime).getWeek() == new Date().getWeek()) {
                                if (weekday[new Date(element.start.dateTime).getDay()] == weekday[i]) {
                                    strCal += new Date(element.start.dateTime).getHours() + ":" + new Date(element.start.dateTime).getMinutes() + ' - ' + new Date(element.end.dateTime).getHours() + ":" + new Date(element.end.dateTime).getMinutes() + "\t|\t" + element.summary + "\n"
                                }
                            }
                        })
                        if (strCal == "") {
                            strCal += "Rien de prévu " + weekday[i] + " !";
                        }
                        embed.addField("**" + weekday[i] + "**", "```" + strCal + "```")
                    };
                    embed.setTimestamp()
                        .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
                    return message.reply(embed);
                });
            });

            req.on('error', function (e) {
                console.log(e.message);
            });
        }

        // League Commands
        else if (command === "league") {
            const args = message.content.slice(this.prefix.length).trim().split(' ');

            if (args.length == 1) {
                return message.reply(`Tu n'as pas spécifié de nom d'invocateur !`);
            }

            var summonerName = "";
            for (var i = 1; i < args.length; i++) {
                if (i > 1) {
                    summonerName += " ";
                }
                summonerName += args[i];
            }

            if (await this.league.updateSummonerData(summonerName) == false) {
                return message.reply(`Le nom d'invocateur n'existe pas !`);
            }


            setTimeout(() => {
                this.SQLConnect();
                this.con.query('SELECT name FROM summoners WHERE name = "' + summonerName + '";', function (error, results, fields) {
                    if (error) throw error;
                    console.log(results.insertId);
                    if (results[0] == null) {
                        console.log(summonerName + ' is not a valid name.');
                        return message.reply(`Le nom d'invocateur n'existe pas !`);
                    } else {
                        this.SQLConnect();
                        this.con.query('SELECT * FROM summoners s INNER JOIN league l ON s.id = l.summonerId WHERE s.name = "' + summonerName + '";', function (error, results, fields) {
                            if (error) throw error;
                            //console.log(results);
                            if (results[0] != null) {
                                const embed = new MessageEmbed()
                                    .setTitle('Stats de ' + results[0].name)
                                    .setColor(0x0000FF)
                                    .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                                    .setDescription(`Niveau d'invocateur : ` + results[0].summonerLevel)
                                    .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                                results.forEach(element => {
                                    switch (element.queueType) {
                                        case 'RANKED_SOLO_5x5':
                                            embed.addFields({ name: '__', value: "__**Solo/Duo**__" },)
                                            break;
                                        case 'RANKED_FLEX_SR':
                                            embed.addFields({ name: '__', value: "__**Flexible**__" },)
                                            break;
                                        default:
                                            embed.addFields({ name: '__', value: "__**File inconnue**__" },)
                                    }
                                    embed.addField('Elo :', element.tier + " " + element.rank + ' - ' + element.leaguePoints + ' LP', true)
                                        .addField('Victoire(s) :' + element.wins + "\tDéfaite(s) : " + element.losses, "Ratio/Win rate: " + element.wins * 100 / (element.wins + element.losses).toFixed(1) + ' %', true)
                                        .setTimestamp()
                                        .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
                                });
                                message.reply(embed);
                            } else {
                                this.SQLConnect();
                                this.con.query('SELECT * FROM summoners WHERE name = "' + summonerName + '";', function (error, results, fields) {
                                    if (error) throw error;
                                    const embedNoInfo = new MessageEmbed()
                                    embedNoInfo.setTitle('Stats de ' + results[0].name)
                                        .setColor(0x0000FF)
                                        .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                                        .setDescription(`Niveau d'invocateur : ` + results[0].summonerLevel)
                                        .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                                        .addField('__', 'Ce joueur n\'a pas de statistiques en partie classée :(', true)
                                        .setTimestamp()
                                        .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
                                    message.reply(embedNoInfo);
                                });
                                this.con.end();
                                console.log("MySQL disconnected!");
                            }
                        });
                    }
                    this.con.end();
                    console.log("MySQL disconnected!");
                });
                this.con.end();
                console.log("MySQL disconnected!");
            }, 2000);
        }

        // Osu Commands
        else if (command === "osu") {
            const args = message.content.slice(this.prefix.length).trim().split(' ');

            if (args.length == 1) {
                return message.reply(`Tu n'as pas spécifié de nom d'utilisateur !`);
            }

            var osuUsername = "";
            for (var i = 1; i < args.length; i++) {
                if (i > 1) {
                    osuUsername += " ";
                }
                osuUsername += args[i];
            }

            let osuData = await this.osu.getOsuUser(osuUsername);
            console.log(osuData)
            const embed = new MessageEmbed()
                .setTitle(osuData.is_online ? "Stats Osu! de " + osuData.username + " 🟢" : "Stats Osu! de " + osuData.username + " 🔴")
                .setColor(0x0000FF)
                .setAuthor('ManiaBot', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png')
                .setDescription(`Niveau : ` + osuData.statistics.level.current + ' | ' + osuData.statistics.level.progress + "%")
            if (music.validURL(osuData.avatar_url)) {
                embed.setThumbnail(osuData.avatar_url)
            } else {
                embed.attachFiles(['img/osuGuest.png'])
                    .setThumbnail('attachment://osuGuest.png')
            }
            embed.addFields({ name: 'Statistiques Osu! :', value: "PP : " + osuData.statistics.pp + "\nTop : " + osuData.statistics.pp_rank + "\nTop par pays : " + osuData.statistics.rank.country + "\nPrécision : " + osuData.statistics.hit_accuracy + "%\nNombre de plays : " + osuData.statistics.play_count },)
                .setTimestamp()
                .setFooter('Créé par les soins de Vinmania :)', 'https://static-cdn.jtvnw.net/jtv_user_pictures/f7fa0018-26d3-4398-b0dd-d4642842d87d-profile_image-70x70.png');
            message.reply(embed);
        }

        else if (command === "pf") {
            var res = Math.random() * 100;
            if (res < 50) {
                message.channel.send('Pile !');
            } else {
                message.channel.send('Face !');
            }
        }

        else if (command === "rdm") {
            if (args.length == 1) {
                return message.reply(`Donne-moi des noms !`);
            }
            message.channel.send('L\'heureux gagnant est ' + args[Math.floor(Math.random() * (args.length - 1)) + 1] + ' !');
        }
        // else if (command === "addSample") {
        //     const args = message.content.slice(config.PREFIX.length).trim().split(' ');

        //     if (message.attachments.size <= 0) {
        //         return message.reply("Tu dois donner ton sample avec !addSample.");
        //     }

        //     //message.attachments.url

        //     if (message.attachments.url === "^(https?|ftp|file):\/\/(www.)?(.*?)\.(mp3)$") {
        //         const downloadFile = (async (url, path) => {
        //             const res = await fetch(url);
        //             const fileStream = fs.createWriteStream(path);
        //             await new Promise((resolve, reject) => {
        //                 res.body.pipe(fileStream);
        //                 res.body.on("error", reject);
        //                 fileStream.on("finish", resolve);
        //             });
        //         });
        //     } else {
        //         message.reply("Tu dois me fournir un fichier mp3 pour que je puisse j'ajouer à la bibliothèque.")
        //     }

        else {
            message.reply("**\\*bip\\*** Je suis désolé. **\\*bip\\*** La commande n'existe pas (ou pas encore). **\\*bip\\***");
        }

        return Promise.reject();
    }
}

Date.prototype.getWeek = function() {
    /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

    //var dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
    var newYear = new Date(this.getFullYear(), 0, 1);
    var day = newYear.getDay(); //the day of week the year begins on
    day = (day >= 0 ? day : day + 7);
    var daynum = Math.floor((this.getTime() - newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) / 86400000) + 1;
    var weeknum;
    //if the year starts before the middle of a week
    if (day < 4) {
        weeknum = Math.floor((daynum + day - 1) / 7) + 1;
        if (weeknum > 52) {
            var nYear = new Date(this.getFullYear() + 1, 0, 1);
            var nday = nYear.getDay();
            nday = nday >= 0 ? nday : nday + 7;
            /*if the next year starts before the middle of
              the week, it is week #1 of that year*/
            weeknum = nday < 4 ? 1 : 53;
        }
    } else {
        weeknum = Math.floor((daynum + day - 1) / 7);
    }
    return weeknum;
};