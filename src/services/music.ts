import { Guild, Message } from "discord.js";
import {injectable} from "inversify";
import { YouTube } from "youtube-sr";
import ytdl from "ytdl-core";

@injectable()
export class Music {
    private queue: Map<any, any>;

    constructor() {
        this.queue = new Map();
    }

    public async execute(message: Message) {
        const args = message.content.split(" ");

        var serverQueue = this.queue.get(message.guild.id);

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

        let songInfoURL;

        if (!this.validURL(args[1])) {
            var songSearch = "";
            for (var i = 1; i < args.length; i++) {
                if (i > 1) {
                    songSearch += " ";
                }
                songSearch += args[i];
            }
            await YouTube.search(songSearch, { limit: 5, type:'video'})
                .then(x => {
                    songInfoURL = "https://www.youtube.com/watch?v=" + x[0].id;
                })
                .catch(console.error);
        } else {
            songInfoURL = args[1];
        }

        const songInfo = await ytdl.getInfo(songInfoURL);
        const song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url
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

            this.queue.set(message.guild.id, queueContruct);

            queueContruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                this.play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                this.queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        } else {
            serverQueue.songs.push(song);
            return message.channel.send(`${song.title} a été ajouté à la liste d'attente !`);
        }
    }

    public skip(message: Message) {
        var serverQueue = this.queue.get(message.guild.id);

        if (!message.member.voice.channel)
            return message.channel.send(
                "Tu dois être dans un salon vocal pour passer la musique !"
            );
        if (!serverQueue)
            return message.channel.send("Il n'y a aucun son à passer !");
        serverQueue.connection.dispatcher.end();
    }

    public stop(message): void {
        var serverQueue = this.queue.get(message.guild.id);
        /*
        if (!message.member.voice.channel) 
        return message.channel.send(
            "Tu dois être dans un salon vocal pour arrêter la musique !"
        );
        */
        if (serverQueue && message.guild) {
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
        }
    }

    public play(guild: Guild, song: any) {
        const serverQueue = this.queue.get(guild.id);
        if (!song) {
            serverQueue.voiceChannel.leave();
            this.queue.delete(guild.id);
            return;
        }

        console.log(song)

        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on("finish", () => {
                serverQueue.songs.shift();
                this.play(guild, serverQueue.songs[0]);
            })
            .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Lecture de : **${song.title}**`);
    }
    
    public async joinVocal(message) {
        var serverQueue = this.queue.get(message.guild.id);

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

        if (!serverQueue || serverQueue.songs === []) {
            return message.channel.send(
                "Je n'ai aucun son à jouer, pas le peine de te rejoindre !"
            );
        } else {
            try {
                var connection = await voiceChannel.join();
                serverQueue.textChannel = message.channel;
                serverQueue.voiceChannel = voiceChannel;
                serverQueue.connection = connection;
            } catch (err) {
                console.log(err);
                this.queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        }
    }

    public validURL(str: string): boolean {
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!pattern.test(str);
    }
}