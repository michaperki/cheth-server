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
const { parseGameInfo } = require('../../utils/gameUtils');

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
        currentGameContract.on('FundsTransferred', async (to, amount) => {
            console.log('FundsTransferred event received');
            console.log('Recipient:', to);
            console.log("type of recipient", typeof to);
            console.log('Amount:', amount);

            // Convert BigInt amount to string
            const amountString = amount.toString();

            // conver

            // get the player id from the wallet address
            const player = await db.getUserByWalletAddress(to);

            const userID = player.user_id;

            // send a message to the client
            const message = JSON.stringify({ type: 'FUNDS_TRANSFERRED', userID, to, amount: amountString });

            console.log("sending FundsTransferred message to the client")

            // send a message to the client
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });

            // Update the game balance for the recipient            
            console.log('updating the database with the amount transferred');
            console.log('gameId', gameId);
            console.log('game', game);

            // get the user informaton from the database for player1_id and player2_id
            const player1 = await db.getUserById(game.player1_id);
            const player2 = await db.getUserById(game.player2_id);

            // Normalize the addresses to lowercase
            const normalizedTo = to.toLowerCase();
            const normalizedPlayer1Address = player1.wallet_address.toLowerCase();
            const normalizedPlayer2Address = player2.wallet_address.toLowerCase();

            // Check if either of the players is the recipient
            if (normalizedPlayer1Address === normalizedTo) {
                // update the game balance for player1
                const newBalance = Number(game.player1_payout) + Number(amount);
                await db.updateGameBalanceForPlayer1(gameId, newBalance);
            } else if (normalizedPlayer2Address === normalizedTo) {
                // update the game balance for player2
                const newBalance = Number(game.player2_payout) + Number(amount);
                await db.updateGameBalanceForPlayer2(gameId, newBalance);
            } else {
                console.log('Recipient is not a player in the game, assuming commission');
                const newBalance = Number(game.commission) + Number(amount);
                await db.updateCommission(gameId, newBalance);
            }

            // Update the reward pool in the database (subtract the amount)
            const currentRewardPool = await db.getRewardPool(gameId);
            const newRewardPool = Number(currentRewardPool) - Number(amount);
            await db.updateRewardPool(gameId, newRewardPool);

            // update the winner in the database
            await db.updateWinner(gameId, 'Cancelled');        

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

        // subscribe to the FundsTransferred event
        // there will be two
        // one for the winner and one for the commission
        // can we use .once ?
        gameContract.on('FundsTransferred', async (to, amount) => {
            console.log('FundsTransferred event received');
            console.log('Recipient:', to);
            console.log('Amount:', amount);

            // get the player id from the wallet address
            const player = await db.getUserByWalletAddress(to);

            // Convert BigInt amount to string
            const amountString = amount.toString();

            const message = JSON.stringify({ type: 'FUNDS_TRANSFERRED', to, amount: amountString });
            console.log("sending FundsTransferred message to the client")
            console.log("player.user_id", player.user_id)

            // send a message to the client
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    if (parseInt(client.userId) === player.user_id) {
                        client.send(message);
                    }
                }
            });

            // check if the recipient's user ID matches either player1_id or player2_id
            // if it does, update the game balance for the recipient
            if (player.user_id === game.player1_id) {
                const newBalance = Number(game.player1_payout) + Number(amount);
                await db.updateGameBalanceForPlayer1(gameId, newBalance);
                // Update the Winner in the database
                await db.updateWinner(gameId, game.player1_id);
            } else if (player.user_id === game.player2_id) {
                const newBalance = Number(game.player2_payout) + Number(amount);
                await db.updateGameBalanceForPlayer2(gameId, newBalance);
                // Update the Winner in the database
                await db.updateWinner(gameId, game.player2_id);
            } else {
                // if the recipient is not a player, assume it is the commission
                const newBalance = Number(game.commission) + Number(amount);
                await db.updateCommission(gameId, newBalance);
            }

            // Update the reward pool in the database (subtract the amount)
            const currentRewardPool = await db.getRewardPool(gameId);
            const newRewardPool = Number(currentRewardPool) - Number(amount);
            await db.updateRewardPool(gameId, newRewardPool);
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

            // Update the winner in the database
            await db.updateWinner(gameId, 'Draw');
            
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