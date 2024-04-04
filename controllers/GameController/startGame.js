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
    // Send a message to the client to start the game
    console.log('game started');
    // create a new game in the contract
    console.log('creating a new game contract using factory contract');
    console.log('db game_id', dbGame.game_id);
    // const { player1_id, player2_id } = dbGame;

    // Define the event handler outside of the route handler to avoid adding multiple event handlers
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

            // get the user data from the database for dbGame.player1_id and dbGame.player2_id
            // get the wallet address of the player
            // get the player id from the dbGame

            const player1_details = await db.getUserById(dbGame.player1_id);
            const player2_details = await db.getUserById(dbGame.player2_id);

            console.log('player1_details', player1_details);
            console.log('player2_details', player2_details);

            const player_id = player === player1_details.wallet_address ? dbGame.player1_id : dbGame.player2_id;
            console.log('player_id', player_id);
            
            // send db.setPlayerReady(dbGame.game_id, player_id);
            await db.setPlayerReady(dbGame.game_id, player_id);

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

        factoryContract.off('GameCreated', handleGameCreated);
    };

    console.log('factoryContract', factoryContract);

    // Add the event handler
    factoryContract.on('GameCreated', handleGameCreated);

    // Call the function to create a new game
    contractFactoryFunctions.createGame(dbGame.game_id, wagerSize);

    // get the player ids
    const { player1_id, player2_id } = dbGame;

    const message = JSON.stringify({ type: 'START_GAME', gameId: dbGame.game_id });
    // Broadcasting the message to all connected WebSocket clients
    Object.values(clients).forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            // send the message to the player 1 and player 2
            if (parseInt(ws.userId) === player1_id || parseInt(ws.userId) === player2_id) {
                ws.send(message);
            }
        }
    });

}

module.exports = startGame;
