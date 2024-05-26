"use strict";
// errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidGameStateError = exports.GameNotFoundError = void 0;
class GameNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "GameNotFoundError";
    }
}
exports.GameNotFoundError = GameNotFoundError;
class InvalidGameStateError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidGameStateError";
    }
}
exports.InvalidGameStateError = InvalidGameStateError;
