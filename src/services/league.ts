import { Message } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { get } from "https";
import { Connection, createConnection } from "mysql";

@injectable()
export class League {
    private con: Connection;
    private readonly mysqlHost: string;
    private readonly mysqlPort: number;
    private readonly mysqlUser: string;
    private readonly mysqlPassword: string;
    private readonly mysqlDatabase: string;
    private readonly riotAPIKey: string;

    constructor(
        @inject(TYPES.MysqlHost) mysqlHost: string,
        @inject(TYPES.MysqlPort) mysqlPort: number,
        @inject(TYPES.MysqlUser) mysqlUser: string,
        @inject(TYPES.MysqlPassword) mysqlPassword: string,
        @inject(TYPES.MysqlDatabase) mysqlDatabase: string,
        @inject(TYPES.RiotAPIKey) riotAPIKey: string,
    ) {
        this.mysqlHost = mysqlHost;
        this.mysqlPort = mysqlPort;
        this.mysqlUser = mysqlUser;
        this.mysqlPassword = mysqlPassword;
        this.mysqlDatabase = mysqlDatabase;
        this.riotAPIKey = riotAPIKey;
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

    public async getRiotAPIData(request, args) {
        var url = 'https://euw1.api.riotgames.com' + request + args + '?api_key=' + this.riotAPIKey;

        let req = get(url, (res) => {
            let data = '';

            res.on('data', function (stream) {
                data += stream;
            });
            res.on('end', function () {
                console.log(data)
                return data;
            })
        });

        req.on('error', function (e) {
            console.log(e.message);
        });
        return JSON.parse(JSON.stringify(req));
    }

    public async updateSummonerData(summonerName): Promise<Boolean> {
        var summonerJSON = await this.getRiotAPIData('/lol/summoner/v4/summoners/by-name/', summonerName);
        console.log()
        if (summonerJSON.hasOwnProperty('id')) {
            this.SQLConnect();
            this.con.query('REPLACE INTO summoners (id, accountId, puuid, name, profileIconId, revisionDate, summonerLevel) VALUES ("' + summonerJSON.id + '", "' + summonerJSON.accountId + '", "' + summonerJSON.puuid + '", "' + summonerJSON.name + '", ' + summonerJSON.profileIconId + ', ' + summonerJSON.revisionDate + ', ' + summonerJSON.summonerLevel + ');', function (error, results, fields) {
                if (error) throw error;
                console.log(results.insertId);
            });
            this.updateLeagueData(summonerJSON.id);
            this.con.end();
            console.log("MySQL disconnected!");
            return true;
        } else if (summonerJSON.hasOwnProperty('status')) {
            console.log('Error: No ranked data.');
            return false;
        } else {
            console.log('Error: Summoner update not successful.');
            return false;
        }
    }

    public async updateLeagueData(summonerId) {
        var leagueJSON = await this.getRiotAPIData('/lol/league/v4/entries/by-summoner/', summonerId);
        if (leagueJSON != null) {
            this.SQLConnect();
            leagueJSON.forEach(element => {
                this.con.query('REPLACE INTO league (leagueId, queueType, tier, rank, summonerId, summonerName, leaguePoints, wins, losses, veteran, inactive, freshBlood, hotStreak) VALUES ("' + element.leagueId + '", "' + element.queueType + '", "' + element.tier + '", "' + element.rank + '", "' + element.summonerId + '", "' + element.summonerName + '", ' + element.leaguePoints + ', ' + element.wins + ', ' + element.losses + ', ' + element.veteran + ', ' + element.inactive + ', ' + element.freshBlood + ', ' + element.hotStreak + ');', function (error, results, fields) {
                    if (error) throw error;
                    console.log(results.insertId);
                });
            });
            this.con.end();
            console.log("MySQL disconnected!");
            return Boolean(true);
        } else {
            console.log('Error: League update not successful.');
            return Boolean(false);
        }
    }

    public checkSummonerDataExists(summonerName) {
        let check;
        this.SQLConnect();
        this.con.query('SELECT name FROM summoners WHERE name = "' + summonerName + '";', function (error, results, fields) {
            if (error) throw error;
            console.log(results.insertId);
            if (results[0] == null) {
                console.log(summonerName + ' is not a valid name.');
            }
            check = results[0] != null;
        });
        this.con.end();
        console.log("MySQL disconnected!");
        return Boolean(check);
    }

    public checkTeamByNameExists(teamName) {
        this.SQLConnect();
        this.con.query('SELECT name FROM teams WHERE name = ' + teamName + ';', function (error, results, fields) {
            if (error) throw error;
            console.log(results.insertId);
            if (results.name != null) {
                return Boolean(true);
            } else {
                console.log(teamName + ' is not a valid name.');
                return Boolean(false);
            }
        });
        this.con.end();
        console.log("MySQL disconnected!");
        return false;
    }

    public createTeam(name, summonersName) {
        var allSummonersOk = true;
        summonersName.forEach(summoner => {
            if (this.checkSummonerDataExists(summoner) == false) {
                allSummonersOk = false;
            }
        });
        if (allSummonersOk && this.checkTeamByNameExists(name)) {
            this.SQLConnect();
            this.con.query('INSERT INTO teams (name, summonerName1, summonerName2, summonerName3, summonerName4, summonerName5) VALUES ("' + name + '", "' + summonersName[0] + '", "' + summonersName[1] + '", "' + summonersName[2] + '", "' + summonersName[3] + '", "' + summonersName[4] + '");', function (error, results, fields) {
                if (error) throw error;
            });
            this.con.end();
            console.log("MySQL disconnected!");
        }
    }

    public getTeamData(name) {
        this.SQLConnect();
        this.con.query('SELECT * FROM leagueTeams WHERE name = ' + name, function (error, results, fields) {
            if (error) throw error;
            return results;
        });
        this.con.end();
        console.log("MySQL disconnected!");
    }
}