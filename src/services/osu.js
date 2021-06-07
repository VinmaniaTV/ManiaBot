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
exports.Osu = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../types");
let Osu = class Osu {
    constructor(osuAPIKey) {
        this.osuAPIKey = osuAPIKey;
    }
    getOsuUser(osuUsername) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new URL("https://osu.ppy.sh/api/v2/users/" + osuUsername + "/osu");
            const res = yield fetch("https://osu.ppy.sh/oauth/token", {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "grant_type": "client_credentials",
                    "client_id": 3904,
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
                };
                return fetch(url.toString(), {
                    method: "GET",
                    headers: headers,
                })
                    .then(response => response.json())
                    .then(json => {
                    return json;
                });
            });
            return res;
        });
    }
};
Osu = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(types_1.TYPES.OsuAPIKey)),
    __metadata("design:paramtypes", [String])
], Osu);
exports.Osu = Osu;
//# sourceMappingURL=osu.js.map