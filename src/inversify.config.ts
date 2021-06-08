import "reflect-metadata";
import {Container} from "inversify";
import {TYPES} from "./types";
import {Bot} from "./bot";
import {Client} from "discord.js";
import { MessageResponder } from "./services/message-responder";
import { PingFinder } from "./services/ping-finder";
import { Music } from "./services/music";
import { League } from "./services/league";
import { Osu } from "./services/osu";
import { Slash } from "./services/slash";

let container = new Container();

container.bind<Bot>(TYPES.Bot).to(Bot).inSingletonScope();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<string>(TYPES.Token).toConstantValue(process.env.TOKEN);
container.bind<string>(TYPES.Prefix).toConstantValue(process.env.PREFIX);
container.bind<string>(TYPES.MysqlHost).toConstantValue(process.env.MYSQLHOST);
container.bind<string>(TYPES.MysqlPort).toConstantValue(process.env.MYSQLPORT);
container.bind<string>(TYPES.MysqlUser).toConstantValue(process.env.MYSQLUSER);
container.bind<string>(TYPES.MysqlPassword).toConstantValue(process.env.MYSQLPASSWORD);
container.bind<string>(TYPES.MysqlDatabase).toConstantValue(process.env.MYSQLDATABASE);
container.bind<string>(TYPES.Calendar).toConstantValue(process.env.CALENDAR);
container.bind<string>(TYPES.RiotAPIKey).toConstantValue(process.env.RIOT_API_KEY);
container.bind<string>(TYPES.OsuAPIKey).toConstantValue(process.env.OSU_API_KEY);
container.bind<string>(TYPES.OsuClientId).toConstantValue(process.env.OSU_CLIENT_ID);
container.bind<MessageResponder>(TYPES.MessageResponder).to(MessageResponder).inSingletonScope();
container.bind<PingFinder>(TYPES.PingFinder).to(PingFinder).inSingletonScope();
container.bind<Music>(TYPES.Music).to(Music).inSingletonScope();
container.bind<League>(TYPES.League).to(League).inSingletonScope();
container.bind<Osu>(TYPES.Osu).to(Osu).inSingletonScope();
container.bind<Slash>(TYPES.Slash).to(Slash).inSingletonScope();

export default container;