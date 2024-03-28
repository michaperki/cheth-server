// controllers/GameController.js

const db = require('../db');
const WebSocket = require('ws');
const ethers = require('ethers');

const chessContractAbi = require('../abis/Chess.json');
const factoryContractAbi = require('../abis/ChessFactory.json');
const chessContract = require('../contracts/ChessContractFunctions');
const contractFactoryFunctions = require('../contracts/ContractFactoryFunctions');
const { createChallenge } = require('../utils/lichessUtils');
const factoryContractAddress = factoryContractAbi.networks[process.env.CHAIN_ID].address;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);
const factoryContract = new ethers.Contract(factoryContractAddress, factoryContractAbi.abi, signer);

const GameController = {
    async playGame(req, res, next) {
        console.log('/playGame route');
        try {
            const userId = req.body.userId;
            const dbGames = await db.playGame(userId);
            const dbGame = dbGames[0];
            console.log('dbGame', dbGame);
            // if the game state is 1, then the game is started
            if (dbGame.state === '1') {
                await GameController.startGame(dbGame, req.wss);
            }
            res.json(dbGame);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },

    async startGame(dbGame, wss) {
        // Send a message to the client to start the game
        console.log('game started');

        // create a new game in the contract
        console.log('creating a new game contract using factory contract');
        console.log('db game_id', dbGame.game_id);

        // Define the event handler outside of the route handler to avoid adding multiple event handlers
        const handleGameCreated = (game, creator) => {
            console.log('GameCreated event received');
            console.log('game', game);
            console.log('creator', creator);
            db.updateGameContractAddress(dbGame.game_id, game);
            db.updateGameState(dbGame.game_id, 2);
            db.updateGameCreatorAddress(dbGame.game_id, creator);
            // Broadcasting the message to all connected WebSocket clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'CONTRACT_READY', gameId: dbGame.game_id }));
                }
            });

            // Instantiate the contract
            const gameContract = new ethers.Contract(game, chessContractAbi.abi, signer);

            // Subscribe to GameJoined event
            console.log('subscribing to GameJoined event');
            // there will be two GameJoined events, one for each player
            gameContract.on('GameJoined', async (player, entryFee) => {
                console.log('GameJoined event received');
                console.log('player', player);
                console.log('entryFee', entryFee);
                console.log('dbGame.game_id', dbGame.game_id);
                // update the reward pool in the database, add the entry fee to the reward pool

                /// get the current reward pool
                const currentRewardPool = await db.getRewardPool(dbGame.game_id);
                console.log('currentRewardPool', currentRewardPool);
                const newRewardPool = Number(currentRewardPool) + Number(entryFee);
                console.log('newRewardPool', newRewardPool);
                await db.updateRewardPool(dbGame.game_id, newRewardPool);
                await db.updateGameState(dbGame.game_id, 3);

                // Broadcasting the message to all connected WebSocket clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'GAME_JOINED', gameId: dbGame.game_id, player }));
                    }
                });
            });

            // Subscribe to GamePrimed event
            console.log('subscribing to GamePrimed event');
            gameContract.once('GamePrimed', async (white, black, entryFee) => {
                console.log('GamePrimed event received');
                console.log('white', white);
                console.log('black', black);
                console.log('entryFee', entryFee);
                console.log('dbGame.game_id', dbGame.game_id);
                console.log('dbCreator', dbGame.creator);

                // create a challenge on lichess
                // get the lichess handles of the players
                // the dbGame has the player ids, get the lichess handles of the players
                // from the db using the player ids
                const player1 = db.getUsersById(dbGame.player1_id);
                const player2 = db.getUsersById(dbGame.player2_id);
                console.log('player1', player1);
                console.log('player2', player2);

                const username1 = player1.username;
                const username2 = player2.username;
                console.log('username1', username1);
                console.log('username2', username2);

                const challengeData = await createChallenge(username1, username2);
                console.log('challengeData', challengeData);

                // update the lichess_id in the database
                await db.updateLichessId(dbGame.game_id, challengeData.challenge.id);


                await db.updateGameState(dbGame.game_id, 4);

                // Broadcasting the message to all connected WebSocket clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'GAME_PRIMED', gameId: dbGame.game_id, creator: dbGame.game_creator_address }));
                    }
                });
            });
        };

        console.log('factoryContract', factoryContract);

        // Add the event handler
        factoryContract.on('GameCreated', handleGameCreated);

        // Call the function to create a new game
        contractFactoryFunctions.createGame(dbGame.game_id);

        const message = JSON.stringify({ type: 'START_GAME', gameId: dbGame.game_id });
        // Broadcasting the message to all connected WebSocket clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });

    },

    async getGame(req, res, next) {
        try {
            const gameId = req.params.gameId;
            const game = await db.getGameById(gameId);
            if (!game) {
                return res.status(404).json({ error: 'Game not found' });
            }
            res.json(game);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },

    async getGames(req, res, next) {
        try {
            const games = await db.getGames();
            res.json(games);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },

    async cancelGamePairing(req, res, next) {
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
    },

    async cancelGame(req, res, next) {
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
    },

    async reportGameOver(req, res, next) {
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
    }, 

    async forceDraw(req, res, next) {
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
    },
    

    async deleteGame(req, res, next) {
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
    },

    async refreshContractBalance(req, res, next) {
        console.log('/refreshContractBalance route');
        try {
            const gameId = req.body.gameId;
            const game = await db.getGameById(gameId);
            if (!game) {
                return res.status(404).json({ error: 'Game not found' });
            }
    
            console.log('game', game);
    
            const contractAddress = game.contract_address;
            // if the contract address is null, then the contract has not been created, so return an error
            if (!contractAddress) {
                return res.status(400).json({ error: 'Contract not created' });
            }
            console.log('contractAddress', contractAddress);
            const balance = await chessContract.getContractBalance(contractAddress);
            console.log('balance', balance);
            await db.updateRewardPool(gameId, balance.toString());
            res.json({ message: 'Data refreshed successfully' });
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    }
};

module.exports = GameController;


// Suggestions for improvement:
// - Add error handling middleware to handle errors in a centralized way.
//