"use strict";
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
exports.createChallenge = exports.fetchLichessUserInfo = void 0;
// src/utils/lichessUtils.ts (Utility functions for Lichess API interaction)
const node_fetch_1 = __importDefault(require("node-fetch"));
function fetchLichessUserInfo(lichessHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const headers = {
                Authorization: "Bearer " + process.env.LICHESS_TOKEN,
            };
            console.log("fetching lichess user info");
            console.log("lichessHandle", lichessHandle);
            console.log("process.env.LICHESS_TOKEN", process.env.LICHESS_TOKEN);
            // log the full url
            console.log(`https://lichess.org/api/user/${lichessHandle}`);
            const response = yield (0, node_fetch_1.default)(`https://lichess.org/api/user/${lichessHandle}`, { headers });
            if (!response.ok) {
                throw new Error("Failed to fetch Lichess user information: " + response.statusText);
            }
            const userInformation = yield response.json();
            return userInformation;
        }
        catch (error) {
            console.error("Error fetching Lichess user information:", error);
            throw error;
        }
    });
}
exports.fetchLichessUserInfo = fetchLichessUserInfo;
function createChallenge(player1Username, player2Username, timeControl) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("createChallenge function");
        console.log("player1Username", player1Username);
        console.log("player2Username", player2Username);
        console.log("timeControl", timeControl);
        try {
            const lichessApiUrl = "https://lichess.org/api/challenge/open";
            const headers = {
                Authorization: "Bearer " + process.env.LICHESS_TOKEN,
                "Content-Type": "application/x-www-form-urlencoded",
            };
            const body = new URLSearchParams({
                variant: "standard",
                rated: "false",
                color: "random",
                "clock.limit": timeControl,
                "clock.increment": "0",
                users: `${player1Username},${player2Username}`,
                rules: "noRematch,noGiveTime,noEarlyDraw",
                name: "Cheth Game",
            });
            const response = yield (0, node_fetch_1.default)(lichessApiUrl, {
                method: "POST",
                headers: headers,
                body: body,
            });
            console.log("Response status code:", response.status);
            if (!response.ok) {
                console.error("Error response:", yield response.text());
                throw new Error("Failed to create open challenge on Lichess");
            }
            const challengeData = yield response.json();
            return challengeData;
        }
        catch (error) {
            console.error("Error creating challenge:", error);
            throw error;
        }
    });
}
exports.createChallenge = createChallenge;
