import { inject, injectable } from "inversify";
import { TYPES } from "../types";

@injectable()
export class Osu {
    readonly osuClientId: number;
    readonly osuAPIKey: string;
    
    constructor(
        @inject(TYPES.OsuClientId) osuClientId: number,
        @inject(TYPES.OsuAPIKey) osuAPIKey: string,
    ) {
        this.osuClientId = osuClientId;
        this.osuAPIKey = osuAPIKey;
    }

    public async getOsuUser(osuUsername) {

        const url = new URL("https://osu.ppy.sh/api/v2/users/" + osuUsername + "/osu");

        const res = await fetch("https://osu.ppy.sh/oauth/token", {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "grant_type": "client_credentials",
                    "client_id": this.osuClientId,
                    "client_secret": this.osuAPIKey,
                    "scope": "public"
                })
            })
            .then(response => response.json())
            .then(auth_key => {

                let headers = {
                    "Authorization": "Bearer " + auth_key.access_token,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }

                return fetch(url.toString(), {
                        method: "GET",
                        headers: headers,
                    })
                    .then(response => response.json())
                    .then(json => {
                        return json
                    });
            });

        return res;
    }
}