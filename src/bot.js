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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const discord_js_1 = require("discord.js");
const inversify_1 = require("inversify");
const types_1 = require("./types");
const message_responder_1 = require("./services/message-responder");
const music_1 = require("./services/music");
let Bot = class Bot {
    constructor(client, token, prefix, messageResponder, music) {
        this.client = client;
        this.token = token;
        this.prefix = prefix;
        this.messageResponder = messageResponder;
        this.music = music;
        client.on("ready", () => {
            client.user.setActivity('/help', { type: 'PLAYING' });
        });
    }
    listen() {
        this.client.on('message', (message) => {
            if (message.author.bot) {
                console.log('Ignoring bot message!');
                return;
            }
            if (!message.content.startsWith(this.prefix))
                return;
            console.log("Message received! Contents: ", message.content);
            this.messageResponder.handle(message, this.music); //.then(() => {
            //   console.log("Response sent!");
            // }).catch(() => {
            //   console.log("Response not sent.")
            // })
        });
        return this.client.login(this.token);
    }
};
Bot = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.Client)),
    __param(1, inversify_1.inject(types_1.TYPES.Token)),
    __param(2, inversify_1.inject(types_1.TYPES.Prefix)),
    __param(3, inversify_1.inject(types_1.TYPES.MessageResponder)),
    __param(4, inversify_1.inject(types_1.TYPES.Music)),
    __metadata("design:paramtypes", [discord_js_1.Client, String, String, message_responder_1.MessageResponder,
        music_1.Music])
], Bot);
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map