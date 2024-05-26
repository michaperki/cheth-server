// errors.ts

class GameNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameNotFoundError";
  }
}

class InvalidGameStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGameStateError";
  }
}

export { GameNotFoundError, InvalidGameStateError };
