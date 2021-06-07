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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.League = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../types");
const https_1 = require("https");
const mysql_1 = require("mysql");
let League = class League {
    constructor(mysqlHost, mysqlPort, mysqlUser, mysqlPassword, mysqlDatabase, riotAPIKey) {
        this.mysqlHost = mysqlHost;
        this.mysqlPort = mysqlPort;
        this.mysqlUser = mysqlUser;
        this.mysqlPassword = mysqlPassword;
        this.mysqlDatabase = mysqlDatabase;
        this.riotAPIKey = riotAPIKey;
        this.con = mysql_1.createConnection({
            host: this.mysqlHost,
            port: this.mysqlPort,
            user: this.mysqlUser,
            password: this.mysqlPassword,
            database: this.mysqlDatabase
        });
    }
    SQLConnect() {
        this.con.connect({ timeout: Infinity }, function (err) {
            if (err)
                throw err;
            console.log("MySQL connected!");
        });
        this.con.query('SET lc_time_names = "fr_FR";', function (error, results, fields) {
            if (error)
                throw error;
            console.log(results.insertId);
        });
    }
    getRiotAPIData(request, args) {
        return __awaiter(this, void 0, void 0, function* () {
            var url = 'https://euw1.api.riotgames.com' + request + args + '?api_key=' + this.riotAPIKey;
            let req = https_1.get(url, (res) => {
                let data = '';
                res.on('data', function (stream) {
                    data += stream;
                });
                res.on('end', function () {
                    console.log(data);
                    return data;
                });
            });
            req.on('error', function (e) {
                console.log(e.message);
            });
            return JSON.parse(JSON.stringify(req));
        });
    }
    updateSummonerData(summonerName) {
        return __awaiter(this, void 0, void 0, function* () {
            var summonerJSON = yield this.getRiotAPIData('/lol/summoner/v4/summoners/by-name/', summonerName);
            console.log();
            if (summonerJSON.hasOwnProperty('id')) {
                this.SQLConnect();
                this.con.query('REPLACE INTO summoners (id, accountId, puuid, name, profileIconId, revisionDate, summonerLevel) VALUES ("' + summonerJSON.id + '", "' + summonerJSON.accountId + '", "' + summonerJSON.puuid + '", "' + summonerJSON.name + '", ' + summonerJSON.profileIconId + ', ' + summonerJSON.revisionDate + ', ' + summonerJSON.summonerLevel + ');', function (error, results, fields) {
                    if (error)
                        throw error;
                    console.log(results.insertId);
                });
                this.updateLeagueData(summonerJSON.id);
                this.con.end();
                console.log("MySQL disconnected!");
                return true;
            }
            else if (summonerJSON.hasOwnProperty('status')) {
                console.log('Error: No ranked data.');
                return false;
            }
            else {
                console.log('Error: Summoner update not successful.');
                return false;
            }
        });
    }
    updateLeagueData(summonerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var leagueJSON = yield this.getRiotAPIData('/lol/league/v4/entries/by-summoner/', summonerId);
            if (leagueJSON != null) {
                this.SQLConnect();
                leagueJSON.forEach(element => {
                    this.con.query('REPLACE INTO league (leagueId, queueType, tier, rank, summonerId, summonerName, leaguePoints, wins, losses, veteran, inactive, freshBlood, hotStreak) VALUES ("' + element.leagueId + '", "' + element.queueType + '", "' + element.tier + '", "' + element.rank + '", "' + element.summonerId + '", "' + element.summonerName + '", ' + element.leaguePoints + ', ' + element.wins + ', ' + element.losses + ', ' + element.veteran + ', ' + element.inactive + ', ' + element.freshBlood + ', ' + element.hotStreak + ');', function (error, results, fields) {
                        if (error)
                            throw error;
                        console.log(results.insertId);
                    });
                });
                this.con.end();
                console.log("MySQL disconnected!");
                return Boolean(true);
            }
            else {
                console.log('Error: League update not successful.');
                return Boolean(false);
            }
        });
    }
    checkSummonerDataExists(summonerName) {
        let check;
        this.SQLConnect();
        this.con.query('SELECT name FROM summoners WHERE name = "' + summonerName + '";', function (error, results, fields) {
            if (error)
                throw error;
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
    checkTeamByNameExists(teamName) {
        this.SQLConnect();
        this.con.query('SELECT name FROM teams WHERE name = ' + teamName + ';', function (error, results, fields) {
            if (error)
                throw error;
            console.log(results.insertId);
            if (results.name != null) {
                return Boolean(true);
            }
            else {
                console.log(teamName + ' is not a valid name.');
                return Boolean(false);
            }
        });
        this.con.end();
        console.log("MySQL disconnected!");
        return false;
    }
    createTeam(name, summonersName) {
        var allSummonersOk = true;
        summonersName.forEach(summoner => {
            if (this.checkSummonerDataExists(summoner) == false) {
                allSummonersOk = false;
            }
        });
        if (allSummonersOk && this.checkTeamByNameExists(name)) {
            this.SQLConnect();
            this.con.query('INSERT INTO teams (name, summonerName1, summonerName2, summonerName3, summonerName4, summonerName5) VALUES ("' + name + '", "' + summonersName[0] + '", "' + summonersName[1] + '", "' + summonersName[2] + '", "' + summonersName[3] + '", "' + summonersName[4] + '");', function (error, results, fields) {
                if (error)
                    throw error;
            });
            this.con.end();
            console.log("MySQL disconnected!");
        }
    }
    getTeamData(name) {
        this.SQLConnect();
        this.con.query('SELECT * FROM leagueTeams WHERE name = ' + name, function (error, results, fields) {
            if (error)
                throw error;
            return results;
        });
        this.con.end();
        console.log("MySQL disconnected!");
    }
};
League = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.MysqlHost)),
    __param(1, inversify_1.inject(types_1.TYPES.MysqlPort)),
    __param(2, inversify_1.inject(types_1.TYPES.MysqlUser)),
    __param(3, inversify_1.inject(types_1.TYPES.MysqlPassword)),
    __param(4, inversify_1.inject(types_1.TYPES.MysqlDatabase)),
    __param(5, inversify_1.inject(types_1.TYPES.RiotAPIKey)),
    __metadata("design:paramtypes", [String, Number, String, String, String, String])
], League);
exports.League = League;
//# sourceMappingURL=league.js.map