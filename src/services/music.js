"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Music = void 0;
const inversify_1 = require("inversify");
const youtube_sr_1 = require("youtube-sr");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
let Music = class Music {
    constructor() {
        this.queue = new Map();
    }
    execute(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = message.content.split(" ");
            var serverQueue = this.queue.get(message.guild.id);
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel)
                return message.channel.send("Connecte-toi dans un salon vocal !");
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send("Je n'ai pas la permission de rejoindre ton salon ou d'y parler ! :(");
            }
            if (args.length < 2) {
                return message.channel.send("Il me faut le lien de ta musique pour que je puisse la jouer ! ♫");
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
                yield youtube_sr_1.YouTube.search(songSearch, { limit: 5, type: 'video' })
                    .then(x => {
                    songInfoURL = "https://www.youtube.com/watch?v=" + x[0].id;
                })
                    .catch(console.error);
            }
            else {
                songInfoURL = args[1];
            }
            const songInfo = yield ytdl_core_1.default.getInfo(songInfoURL);
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
                    var connection = yield voiceChannel.join();
                    queueContruct.connection = connection;
                    this.play(message.guild, queueContruct.songs[0]);
                }
                catch (err) {
                    console.log(err);
                    this.queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            }
            else {
                serverQueue.songs.push(song);
                return message.channel.send(`${song.title} a été ajouté à la liste d'attente !`);
            }
        });
    }
    skip(message) {
        var serverQueue = this.queue.get(message.guild.id);
        if (!message.member.voice.channel)
            return message.channel.send("Tu dois être dans un salon vocal pour passer la musique !");
        if (!serverQueue)
            return message.channel.send("Il n'y a aucun son à passer !");
        serverQueue.connection.dispatcher.end();
    }
    stop(message) {
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
    play(guild, song) {
        const serverQueue = this.queue.get(guild.id);
        if (!song) {
            serverQueue.voiceChannel.leave();
            this.queue.delete(guild.id);
            return;
        }
        console.log(song);
        const dispatcher = serverQueue.connection
            .play(ytdl_core_1.default(song.url))
            .on("finish", () => {
            serverQueue.songs.shift();
            this.play(guild, serverQueue.songs[0]);
        })
            .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Lecture de : **${song.title}**`);
    }
    joinVocal(message) {
        return __awaiter(this, void 0, void 0, function* () {
            var serverQueue = this.queue.get(message.guild.id);
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel)
                return message.channel.send("Connecte-toi dans un salon vocal !");
            const permissions = voiceChannel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                return message.channel.send("Je n'ai pas la permission de rejoindre ton salon ou d'y parler ! :(");
            }
            if (!serverQueue || serverQueue.songs === []) {
                return message.channel.send("Je n'ai aucun son à jouer, pas le peine de te rejoindre !");
            }
            else {
                try {
                    var connection = yield voiceChannel.join();
                    serverQueue.textChannel = message.channel;
                    serverQueue.voiceChannel = voiceChannel;
                    serverQueue.connection = connection;
                }
                catch (err) {
                    console.log(err);
                    this.queue.delete(message.guild.id);
                    return message.channel.send(err);
                }
            }
        });
    }
    validURL(str) {
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!pattern.test(str);
    }
};
Music = __decorate([
    inversify_1.injectable(),
    __metadata("design:paramtypes", [])
], Music);
exports.Music = Music;
//# sourceMappingURL=music.js.map