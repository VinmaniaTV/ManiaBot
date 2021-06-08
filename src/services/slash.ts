import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Requested } from "requests";

@injectable()
export class Slash  {
    private readonly token: string;
    private url: string;
    private json: Object;
    private headers: Object;

    constructor(
        @inject(TYPES.Token) token: string

    ){
        this.token = token;
        this.url = "https://discord.com/api/v8/applications/759213249404469260/guilds/174988121170116608/commands";
        this.json = {
            "name": "blep",
            "description": "Send a random adorable animal photo",
            "options": [
                {
                    "name": "help",
                    "description": "Affiche la liste des commandes en message privé.",
                    //"type": 3,
                    "required": false,
                }
            ]
        };
        this.headers = {
            "Authorization": "Bot " + this.token
        }
        let r = Requested.post(this.url, this.headers, this.json)
        console.log(r)
    }
}