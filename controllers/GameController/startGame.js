// controllers/GameController.js

const db = require('../../db');
const WebSocket = require('ws');
const ethers = require('ethers');

const chessContractAbi = require('../../abis/Chess.json');
const factoryContractAbi = require('../../abis/ChessFactory.json');
const contractFactoryFunctions = require('../../contracts/ContractFactoryFunctions');
const { createChallenge } = require('../../utils/lichessUtils');
const factoryContractAddress = factoryContractAbi.networks[process.env.CHAIN_ID].address;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);
const factoryContract = new ethers.Contract(factoryContractAddress, factoryContractAbi.abi, signer);

async function startGame(dbGame, clients, wagerSize) {
    try {
        console.log('Starting game...');
        console.log('Game ID:', dbGame.game_id);

        // Create game contract using factory contract
        console.log('Creating new game contract using factory contract...');
        const gameContractAddress = await contractFactoryFunctions.createGame(dbGame.game_id, wagerSize);
        console.log('Game contract created:', gameContractAddress);

        // Update game contract address and state in the database
        await db.updateGameContractAddress(dbGame.game_id, gameContractAddress);
        await db.updateGameState(dbGame.game_id, 2);

        // Subscribe to contract events
        subscribeToContractEvents(dbGame, clients);

        // Send start game message to players
        sendStartGameMessage(dbGame, clients);
    } catch (error) {
        console.error('Error starting game:', error);
    }
}

function subscribeToContractEvents(dbGame, clients) {
    // Event handler for GameCreated event
    const handleGameCreated = (game, creator) => {
        console.log('GameCreated event received');
        console.log('game', game);
        console.log('creator', creator);
        db.updateGameContractAddress(dbGame.game_id, game);
        db.updateGameState(dbGame.game_id, 2);
        db.updateGameCreatorAddress(dbGame.game_id, creator);
        // Broadcasting the message to all connected WebSocket clients
        const message = JSON.stringify({ type: 'CONTRACT_READY', gameId: dbGame.game_id });

        const { player1_id, player2_id } = dbGame;
        console.log('player1_id', player1_id);
        console.log('player2_id', player2_id);
        console.log('client ids', Object.keys(clients));
        Object.values(clients).forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                // send the message to the player 1 and player 2
                if (parseInt(ws.userId) === player1_id || parseInt(ws.userId) === player2_id) {
                    ws.send(message);
                }
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

            let message = JSON.stringify({ type: 'GAME_JOINED', gameId: dbGame.game_id, player });

            // Broadcasting the message to all connected WebSocket clients
            Object.values(clients).forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    if (parseInt(ws.userId) === dbGame.player1_id || parseInt(ws.userId) === dbGame.player2_id) {
                        ws.send(message);
                    }
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
            console.log('dbGame.time_control', dbGame.time_control);

            // create a challenge on lichess
            // get the lichess handles of the players
            // the dbGame has the player ids, get the lichess handles of the players
            // from the db using the player ids
            const player1 = await db.getUserById(dbGame.player1_id);
            const player2 = await db.getUserById(dbGame.player2_id);
            console.log('player1', player1);
            console.log('player2', player2);

            const username1 = player1.username;
            const username2 = player2.username;
            console.log('username1', username1);
            console.log('username2', username2);

            const challengeData = await createChallenge(username1, username2, dbGame.time_control);
            console.log('challengeData', challengeData);

            // update the lichess_id in the database
            await db.updateLichessId(dbGame.game_id, challengeData.challenge.id);


            await db.updateGameState(dbGame.game_id, 4);

            const message = JSON.stringify({ type: 'GAME_PRIMED', gameId: dbGame.game_id, creator: dbGame.game_creator_address });

            // Broadcasting the message to all connected WebSocket clients
            Object.values(clients).forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    if (parseInt(ws.userId) === dbGame.player1_id || parseInt(ws.userId) === dbGame.player2_id) {
                        ws.send(message);
                    }
                }
            });
        });

        // Subscribe to the FundsTransferred event
        gameContract.on('FundsTransferred', async (to, amount) => {
            console.log('FundsTransferred event received');
            console.log('Recipient:', to);
            console.log('Amount:', amount);

            // Convert BigInt amount to string
            const amountString = amount.toString();

            const message = JSON.stringify({ type: 'FUNDS_TRANSFERRED', to, amount: amountString });

            // send a message to the client
            wss.clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    if (parseInt(ws.userId) === dbGame.player1_id || parseInt(ws.userId) === dbGame.player2_id) {
                        ws.send(message);
                    }
                }
            });

            // Update the reward pool in the database (subtract the amount)
            const currentRewardPool = await db.getRewardPool(dbGame.game_id);
            const newRewardPool = Number(currentRewardPool) - Number(amount);
            await db.updateRewardPool(dbGame.game_id, newRewardPool);
        });

        // Subscribe to the GameFinished event
        gameContract.once('GameFinished', async (winner, winnings) => {
            console.log('GameFinished event received');
            console.log('winner', winner);
            console.log('winnings', winnings);
            console.log('gameId', dbGame.game_id);
            console.log('game', dbGame);

            // Update the game state in the database
            await db.updateGameState(dbGame.game_id, 5);
        });

        factoryContract.off('GameCreated', handleGameCreated);
    };
    
    // Subscribe to GameCreated event
    factoryContract.on('GameCreated', handleGameCreated);
}

function sendStartGameMessage(dbGame, clients) {
    const { player1_id, player2_id } = dbGame;
    const message = JSON.stringify({ type: 'START_GAME', gameId: dbGame.game_id });

    // Broadcast start game message to players
    Object.values(clients).forEach(ws => {
        if (ws.readyState === WebSocket.OPEN && (parseInt(ws.userId) === player1_id || parseInt(ws.userId) === player2_id)) {
            ws.send(message);
        }
    });
}

module.exports = startGame;