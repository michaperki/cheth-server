const express = require('express');
const router = express.Router();
const db = require('./db');
const chessContract = require('./contractChess');
const chessContractAbi = require('./abis/Chess.json');
const factoryContractFunctions = require('./contractFactory');
const factoryContractAbi = require('./abis/ChessFactory.json');
const WebSocket = require('ws'); // Import WebSocket class
const wss = require('./websocket'); // Assuming you export the WebSocket server instance from websocket.js
const ethers = require('ethers');

const contractAddress = factoryContractAbi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = wallet.connect(provider);
const factoryContract = new ethers.Contract(contractAddress, factoryContractAbi.abi, signer);

// Middleware for error handling
router.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// Middleware for request validation
function validateRequestBody(req, res, next) {
    if (!req.body || !req.body.lichessHandle) {
        return res.status(400).json({ error: 'Missing lichessHandle in request body' });
    }
    next();
}

async function fetchLichessUserInfo(lichessHandle) {
    try {
        const headers = {
            Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
        };
        console.log('fetching lichess user info');
        console.log('lichessHandle', lichessHandle);
        console.log('process.env.LICHESS_TOKEN', process.env.LICHESS_TOKEN);
        // log the full url
        console.log(`https://lichess.org/api/user/${lichessHandle}`);
        const response = await fetch(`https://lichess.org/api/user/${lichessHandle}`, { headers });

        if (!response.ok) {
            throw new Error('Failed to fetch Lichess user information: ' + response.statusText);
        }

        const userInformation = await response.json();
        return userInformation;
    } catch (error) {
        console.error('Error fetching Lichess user information:', error);
        throw error;
    }
}

router.post('/checkEligibility', validateRequestBody, async (req, res, next) => {
    console.log('/checkEligibility route')
    try {
        const lichessHandle = req.body.lichessHandle;

        // Check if the user already exists in the database
        const existingUser = await db.getUserByLichessHandle(lichessHandle);
        if (existingUser) {
            return res.json({ isEligible: false, reason: 'User already has an account' });
        }

        const userInfo = await fetchLichessUserInfo(lichessHandle);
        const config = await db.getConfig();

        // Check eligibility based on user info and configuration
        // Implementation of eligibility checks

        // Checking if the user's account is created before the specified date
        const createdBefore = new Date(config.find(item => item.name === 'created_before').value);
        const userCreatedAt = new Date(userInfo.createdAt);
        if (userCreatedAt > createdBefore) {
            return res.json({ isEligible: false, reason: 'Account created after specified date' });
        }

        // Checking if the time control matches the configured time control
        const timeControl = config.find(item => item.name === 'time_control').value;
        if (userInfo.perfs[timeControl].games === 0) {
            return res.json({ isEligible: false, reason: 'No games in specified time control' });
        }

        // Checking if the user has played enough games
        const minGames = parseInt(config.find(item => item.name === 'min_games').value);
        if (userInfo.perfs[timeControl].games < minGames) {
            return res.json({ isEligible: false, reason: 'Not enough games played' });
        }

        // Checking if the user's rating is below the threshold
        const ratingThreshold = parseInt(config.find(item => item.name === 'rating_threshold').value);
        if (userInfo.perfs[timeControl].rating >= ratingThreshold) {
            return res.json({ isEligible: false, reason: 'User rating exceeds threshold' });
        }

        // If all checks passed, the user is eligible
        res.json({ isEligible: true });
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/addUser', validateRequestBody, async (req, res, next) => {
    console.log('/addUser route')
    try {
        const { lichessHandle, walletAddress, darkMode } = req.body;

        // get the rating from lichess
        const userInfo = await fetchLichessUserInfo(lichessHandle);
        const rating = userInfo.perfs.blitz.rating;

        const user = await db.addUser(lichessHandle, rating, walletAddress, darkMode);
        res.json(user);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/checkUser', async (req, res, next) => {
    console.log('/checkUser route')
    try {
        const walletAddress = req.body.walletAddress;
        const userExists = await db.getUserByWalletAddress(walletAddress);

        if (userExists) {
            res.json({ userExists: true, username: userExists.username });
        }
        else {
            res.json({ userExists: false });
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/playGame', async (req, res, next) => {
    console.log('/playGame route');
    try {
        const userId = req.body.userId;
        const dbGames = await db.playGame(userId);
        const dbGame = dbGames[0];
        console.log('dbGame', dbGame);
        // if the game state is 1, then the game is started
        if (dbGame.state === '1') {
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

                const gameContract = new ethers.Contract(game, chessContractAbi.abi, signer);

                // Subscribe to GameJoined event
                console.log('subscribing to GameJoined event');
                // there will be two GameJoined events, one for each player
                gameContract.on('GameJoined', async (player, entryFee) => {
                    console.log('GameJoined event received');
                    console.log('player', player);
                    console.log('entryFee', entryFee);
                    console.log('dbGame.game_id', dbGame.game_id);
                    // update the reward pool in the database
                    await db.updateRewardPool(dbGame.game_id, entryFee);
                    await db.updateGameState(dbGame.game_id, 3);

                    // Broadcasting the message to all connected WebSocket clients
                    req.wss.clients.forEach(client => {
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
                    await db.updateGameState(dbGame.game_id, 4);

                    // Broadcasting the message to all connected WebSocket clients
                    req.wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'GAME_PRIMED', gameId: dbGame.game_id, creator: dbGame.game_creator_address }));
                        }
                    });
                });

                // Broadcasting the message to all connected WebSocket clients
                req.wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'CONTRACT_READY', gameId: dbGame.game_id }));
                    }
                });
            };

            // Add the event handler
            factoryContract.on('GameCreated', handleGameCreated);

            // Call the function to create a new game
            factoryContractFunctions.createGame(dbGame.game_id);

            const message = JSON.stringify({ type: 'START_GAME', gameId: dbGame.game_id });
            // Broadcasting the message to all connected WebSocket clients
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
        res.json(dbGame);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.get('/game/:gameId', async (req, res, next) => {
    try {
        const gameId = req.params.gameId;
        const gameInfo = await db.getGameById(gameId);
        if (!gameInfo) {
            return res.status(404).json({ error: 'Game not found' });
        } else {
            res.json(gameInfo);
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/cancelGame', async (req, res, next) => {
    console.log('/cancelGame route')
    try {
        const gameId = req.body.gameId;
        const game = await db.getGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        const contractAddress = game.contract_address;
        await chessContract.cancelGame(contractAddress);
        res.json({ message: 'Game cancelled successfully' });
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/getUser', async (req, res, next) => {
    console.log('/getUser route');
    try {
        let user;
        if (req.body.userId) {
            // If userId is provided, fetch user by ID
            const userId = req.body.userId;
            user = await db.getUserById(userId);
        } else if (req.body.walletAddress) {
            // If walletAddress is provided, fetch user by wallet address
            const walletAddress = req.body.walletAddress;
            user = await db.getUserByWalletAddress(walletAddress);
        } else {
            return res.status(400).json({ error: 'Missing userId or walletAddress in request body' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        } else {
            res.json(user);
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

async function createChallenge(player1Username, player2Username) {
    console.log('createChallenge function');
    console.log('player1Username', player1Username);
    console.log('player2Username', player2Username);
    try {
        const lichessApiUrl = 'https://lichess.org/api/challenge/open';
        const headers = {
            Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const body = new URLSearchParams({
            variant: 'standard',
            rated: 'false',
            color: 'random',
            'clock.limit': '300',
            'clock.increment': '0',
            users: `${player1Username},${player2Username}`,
            rules: 'noRematch,noGiveTime,noEarlyDraw',
            name: 'Cheth Game'
        });

        const response = await fetch(lichessApiUrl, {
            method: 'POST',
            headers: headers,
            body: body
        });

        console.log('Response status code:', response.status);

        if (!response.ok) {
            console.error('Error response:', await response.text());
            throw new Error('Failed to create open challenge on Lichess');
        }

        const challengeData = await response.json();
        return challengeData;
    }
    catch (error) {
        console.error('Error creating challenge:', error);
        throw error;
    }
}

router.post('/createChallenge', async (req, res, next) => {
    console.log('/createChallenge route');
    try {
        const { player1Username, player2Username, gameId } = req.body;

        // check if the challenge already exists
        const game = await db.getGameById(gameId);
        if (game.lichess_id) {
            return res.json({ url: `https://lichess.org/${game.lichess_id}` });
        }

        const challengeData = await createChallenge(player1Username, player2Username);
        console.log('Challenge created:', challengeData);
        // update the game with the challenge url
        await db.updateLichessId(gameId, challengeData.challenge.id);
        res.json(challengeData);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

function parseGameInfo(gameInfo) {
    console.log('parseGameInfo function');
    
    // Split the response text by line breaks
    const lines = gameInfo.split('\n');
    
    // Initialize an object to store the extracted information
    const parsedInfo = {};
    
    // Iterate over each line and parse the key-value pairs
    lines.forEach(line => {
        // Extract key-value pairs using regex
        const match = line.match(/^\[(.*?)\s"(.*?)"\]$/);
        if (match) {
            const key = match[1];
            const value = match[2];
            parsedInfo[key] = value;
        }
    });
    
    return parsedInfo;
}

router.post('/reportGameOver', async (req, res, next) => {
    console.log('/reportGameOver route');
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
});

module.exports = router;