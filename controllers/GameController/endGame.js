// controllers/GameController.js

const db = require('../../db');
const ethers = require('ethers');
const WebSocket = require('ws');
const chessContractAbi = require('../../abis/Chess.json');
const chessContract = require('../../contracts/ChessContractFunctions');
const { 
    handleError, 
    checkGameExists, 
    isGameInState, 
    validateContractAddress,
    handleFundsTransferred,
    fetchGameInfo,
    determineWinner,
    getValidGame,
    notifyClientsOfGameOver } = require('../../utils/gameUtils');
const { RPC_URL, SEPOLIA_PRIVATE_KEY } = process.env;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(SEPOLIA_PRIVATE_KEY).connect(provider);

async function cancelGamePairing(req, res, next) {
    try {
        const gameId = req.params.gameId;
        await checkGameExists(gameId);
        await isGameInState(gameId, '1');
        await db.cancelGame(gameId);
        res.json({ message: 'Game pairing canceled' });
    } catch (error) {
        handleError(res, error);
    }
}

async function cancelGame(req, res, next) {
    try {
        const gameId = req.body.gameId;
        await checkGameExists(gameId);

        const game = await db.getGameById(gameId);
        await validateContractAddress(game.contract_address);

        const currentGameContract = new ethers.Contract(game.contract_address, chessContractAbi.abi, wallet);

        currentGameContract.on('FundsTransferred', async (to, amount) => {
            await handleFundsTransferred(to, amount, gameId, req.wss);
        });

        await chessContract.cancelGame(game.contract_address);
        await db.updateGameState(gameId, -1);

        res.json({ message: 'Game cancelled successfully' });
    } catch (error) {
        handleError(res, error);
    }
}

async function reportGameOver(req, res, next) {
    try {
        const { gameId } = req.body;
        const game = await getValidGame(gameId);

        const lichessId = game.lichess_id;
        const gameInfo = await fetchGameInfo(lichessId);

        const winnerHandle = determineWinner(gameInfo);
        const winningPlayer = await db.getUserByLichessHandle(winnerHandle);

        const gameContract = new ethers.Contract(game.contract_address, chessContractAbi.abi, wallet);

        gameContract.once('GameFinished', async () => {
            await db.updateGameState(gameId, 5);
        });

        gameContract.on('FundsTransferred', async (to, amount) => {
            await handleFundsTransferred(to, amount, gameId, req.wss);
        });

        await chessContract.finishGame(game.contract_address, winningPlayer.wallet_address);

        notifyClientsOfGameOver(req.wss, gameId, winnerHandle);
        res.json({ winner: winnerHandle });
    } catch (error) {
        handleError(res, error);
    }
}

async function forceDraw(req, res, next) {
    try {
        const { gameId } = req.body;
        const game = await getValidGame(gameId);

        const gameContract = new ethers.Contract(game.contract_address, chessContractAbi.abi, wallet);

        gameContract.once('GameFinished', async () => {
            await db.updateGameState(gameId, 5);
        });

        await gameContract.finishGame('0x0000000000000000000000000000000000000000');
        notifyClientsOfGameOver(req.wss, gameId, 'Draw');
        res.json({ winner: 'Draw' });
    } catch (error) {
        handleError(res, error);
    }
}

async function deleteGame(req, res, next) {
    try {
        const gameId = req.params.gameId;
        await checkGameExists(gameId);
        await isGameInState(gameId, '5');

        await db.deleteGame(gameId);
        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    cancelGamePairing,
    cancelGame,
    reportGameOver,
    forceDraw,
    deleteGame
};