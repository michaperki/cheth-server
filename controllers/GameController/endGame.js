// controllers/GameController.js

const db = require('../../db');
const WebSocket = require('ws');
const ethers = require('ethers');
const chessContractAbi = require('../../abis/Chess.json');
const chessContract = require('../../contracts/ChessContractFunctions');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);

async function cancelGamePairing(req, res, next) {
    try {
        const gameId = req.params.gameId;
        const dbGame = await db.getGameById(gameId);
        if (dbGame.state === '1') {
            await db.cancelGame(gameId);
            res.json({ message: 'Game pairing canceled' });
        } else {
            res.status(400).json({ error: 'Game pairing cannot be canceled' });
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

async function cancelGame(req, res, next) {
    try {
        const gameId = req.body.gameId;
        const game = await db.getGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const contractAddress = game.contract_address;
        if (!contractAddress) {
            return res.status(400).json({ error: 'Contract address not found' });
        }

        // Instantiate the contract
        const currentGameContract = new ethers.Contract(contractAddress, chessContractAbi.abi, signer);

        console.log('Cancelling game with contract address:', contractAddress);

        // Subscribe to the FundsTransferred event
        currentGameContract.once('FundsTransferred', async (to, amount) => {
            console.log('FundsTransferred event received');
            console.log('Recipient:', to);
            console.log('Amount:', amount);

            // Convert BigInt amount to string
            const amountString = amount.toString();

            // send a message to the client
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'FUNDS_TRANSFERRED', to, amount: amountString })); // Send the message with amount as string
                }
            });

            // Update the reward pool in the database (subtract the amount)
            const currentRewardPool = await db.getRewardPool(gameId);
            const newRewardPool = Number(currentRewardPool) - Number(amount);
            await db.updateRewardPool(gameId, newRewardPool);
        });

        // Cancel the game in the contract
        await chessContract.cancelGame(contractAddress);

        // Update the game state in the database
        await db.updateGameState(gameId, -1);

        // Send a confirmation message to the client
        res.json({ message: 'Game cancelled successfully' });
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

async function reportGameOver(req, res, next) {
    try {
        const { gameId } = req.body;
        console.log('gameId', gameId);
        const game = await db.getGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        console.log('game', game);

        const lichessId = game.lichess_id;
        const headers = { Authorization: 'Bearer ' + process.env.LICHESS_TOKEN };
        // get the game info from lichess
        const url = `https://lichess.org/game/export/${lichessId}`;
        console.log('url', url);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error('Failed to fetch game information from Lichess');
        }
        const responseText = await response.text();
        console.log('Response Text:', responseText);

        // Process the response text and extract necessary information
        const gameInfo = parseGameInfo(responseText);
        console.log('Game Info:', gameInfo);

        // Determine the winner and get their handle
        const winner = gameInfo.Result === '1-0' ? 'White' : gameInfo.Result === '0-1' ? 'Black' : 'Draw';
        const winningPlayerHandle = winner === 'White' ? gameInfo.White : winner === 'Black' ? gameInfo.Black : null;
        console.log('winningPlayerHandle', winningPlayerHandle);

        // Get the user id of the winning player
        const winningPlayer = await db.getUserByLichessHandle(winningPlayerHandle);
        console.log('winningPlayer', winningPlayer);

        // Calculate the amount to distribute
        const contractAddress = game.contract_address;

        // instantiate the contract
        const gameContract = new ethers.Contract(contractAddress, chessContractAbi.abi, signer);

        // subscribe to the GameFinished event
        //            emit GameFinished(_winner, winnings);
        gameContract.once('GameFinished', async (winner, winnings) => {
            console.log('GameFinished event received');
            console.log('winner', winner);
            console.log('winnings', winnings);
            console.log('contractAddress', contractAddress);
            console.log('winningPlayer.wallet_address', winningPlayer);
            console.log('winningPlayerHandle', winningPlayerHandle);
            console.log('gameId', gameId);
            console.log('game', game);

            // Update the game state in the database
            await db.updateGameState(gameId, 5);
        });


        // Finish the game in the contract and distribute funds
        await chessContract.finishGame(contractAddress, winningPlayer.wallet_address);

        // Send the winning player's handle as a websocket message
        req.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'GAME_OVER', gameId, winner: winningPlayerHandle }));
            }
        });

        // Send the winning player's handle as the response
        res.json({ winner: winningPlayerHandle });
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

async function forceDraw(req, res, next) {
    console.log('/forceGameOver route');
    try {
        const { gameId } = req.body;
        console.log('gameId', gameId);
        const game = await db.getGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        console.log('game', game);

        const contractAddress = game.contract_address;
        const gameContract = new ethers.Contract(contractAddress, chessContractAbi.abi, signer);

        // subscribe to the GameFinished event
        //            emit GameFinished(_winner, winnings);
        gameContract.once('GameFinished', async (winner, winnings) => {
            console.log('GameFinished event received');
            console.log('winner', winner);
            console.log('winnings', winnings);
            console.log('contractAddress', contractAddress);
            console.log('gameId', gameId);
            console.log('game', game);

            // Update the game state in the database
            await db.updateGameState(gameId, 5);
        });

        // Finish the game in the contract and distribute funds
        // use the clause in the contract for draws
        // if (_winner == address(0)) {
        // how to send the address(0) as the winner?

        await gameContract.finishGame('0x0000000000000000000000000000000000000000');
        // Send the draw message to the clients
        req.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'GAME_OVER', gameId, winner: 'Draw' }));
            }
        });
        res.json({ winner: 'Draw' });
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}


async function deleteGame(req, res, next) {
    try {
        const gameId = req.params.gameId;
        const dbGame = await db.getGameById(gameId);
        if (!dbGame) {
            return res.status(404).json({ error: 'Game not found' });
        }
        if (dbGame.state === '5') {
            await db.deleteGame(gameId);
            res.json({ message: 'Game deleted successfully' });
        } else {
            res.status(400).json({ error: 'Game cannot be deleted' });
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

module.exports = {
    cancelGamePairing,
    cancelGame,
    reportGameOver,
    forceDraw,
    deleteGame
};