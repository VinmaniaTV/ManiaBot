"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config(); // Recommended way of loading dotenv
const inversify_config_1 = __importDefault(require("./inversify.config"));
const types_1 = require("./types");
let bot = inversify_config_1.default.get(types_1.TYPES.Bot);
bot.listen().then(() => {
    console.log('Logged in!');
}).catch((error) => {
    console.log('Oh no! ', error);
});
//# sourceMappingURL=index.js.map