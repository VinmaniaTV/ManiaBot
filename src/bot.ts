import {Client, Message} from "discord.js";
import {inject, injectable} from "inversify";
import {TYPES} from "./types";
import {MessageResponder} from "./services/message-responder";
import { Music } from "./services/music";
import { Slash } from "./services/slash";

@injectable()
export class Bot {
  private client: Client;
  private readonly token: string;
  private readonly prefix: string;
  private messageResponder: MessageResponder;
  private music: Music;
  private slash: Slash;

  constructor(
    @inject(TYPES.Client) client: Client,
    @inject(TYPES.Token) token: string,
    @inject(TYPES.Prefix) prefix: string,
    @inject(TYPES.MessageResponder) messageResponder: MessageResponder,
    @inject(TYPES.Music) music: Music,
    @inject(TYPES.Slash) slash: Slash) {
    this.client = client;
    this.token = token;
    this.prefix = prefix;
    this.messageResponder = messageResponder;
    this.music = music;
    this.slash = slash;
    client.on("ready", () => {
      client.user.setActivity('/help', { type: 'PLAYING' });
    });
  }

  public listen(): Promise<string> {
    this.client.on('message', (message: Message) => {
      if (message.author.bot) {
        console.log('Ignoring bot message!')
        return;
      }

      if (!message.content.startsWith(this.prefix)) return;

      console.log("Message received! Contents: ", message.content);

      this.messageResponder.handle(message, this.music)//.then(() => {
      //   console.log("Response sent!");
      // }).catch(() => {
      //   console.log("Response not sent.")
      // })
    });

    return this.client.login(this.token);
  }
}