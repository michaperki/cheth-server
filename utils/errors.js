class GameNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "GameNotFoundError";
  }
}

class InvalidGameStateError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidGameStateError";
  }
}

module.exports = {
  GameNotFoundError,
};
