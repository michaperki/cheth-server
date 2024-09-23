
const virtualLabsService = require('../services/virtualLabs');
const sessionService = require('../db/sessionService');
const userService = require('../db/userService');

exports.getSessionBalance = async (req, res) => {
    try {
        const walletAddress = req.query.walletAddress || req.user.wallet;
        // get the session ID from the database
        const session = await sessionService.getSessionByWalletAddress(walletAddress);
        const balance = await virtualLabsService.getSessionBalance(session.virtual_labs_session_id, req.headers.authorization);
        console.log('💰 SERVER ~ SESSION BALANCE', balance);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session balance', error: error.message });
    }
};

exports.depositToSession = async (req, res) => {
  try {
      const { amount, walletAddress } = req.body;

    // Log the deposit information
    console.log(`💸 ${walletAddress} deposited ${amount} to session`);

    // Ensure player exists
    const playerResponse = await virtualLabsService.createPlayer(walletAddress, req.headers.authorization);
    console.log(`🔍 Player creation response: ${JSON.stringify(playerResponse)}`);

    // Get or create session
    let session = await sessionService.getExistingSession(walletAddress);
    console.log(`🔍 Session existence check: ${session ? 'Found session' : 'No session found'}`);

    // Create session if not found
    if (!session) {
      const vlSession = await virtualLabsService.createSession(walletAddress, req.headers.authorization);
      console.log(`🔍 VirtualLabs session creation response: ${JSON.stringify(vlSession)}`);
      session = await sessionService.createUserSession(req.user.id, vlSession.sessionId);
      console.log(`🔍 Database session creation response: ${JSON.stringify(session)}`);
    }

    console.log(' Attempting to create participant...');
    console.log(`🔍 Session ID: ${session.id}`);
    // log the session virtual labs session id
    console.log(`🔍 Session virtual labs session id: ${session.virtual_labs_session_id}`);
    console.log(`🔍 Wallet address: ${walletAddress}`);

    // Create or update participant
    const participantResponse = await virtualLabsService.createParticipant(session.virtual_labs_session_id, amount, walletAddress, req.headers.authorization);
    console.log(`🔍 Participant creation/update response: ${JSON.stringify(participantResponse)}`);

    // Deposit to session
    const depositResponse = await virtualLabsService.depositToSession(session.virtual_labs_session_id, walletAddress, amount, req.headers.authorization);
    console.log(`💸 Deposit response: ${JSON.stringify(depositResponse)}`);

    res.json({ message: 'Deposit successful' });
  } catch (error) {
    console.error(`❌ Error in deposit flow: ${error.message}`, error);
    res.status(500).json({ message: 'Error depositing to session', error: error.message });
  }
};

exports.createSession = async (req, res) => {
    try {
        const result = await virtualLabsService.createSession(req.user.wallet);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error creating session', error: error.message });
    }
};

exports.finishSession = async (req, res) => {
    try {
        const result = await virtualLabsService.finishSession(req.user.wallet);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error finishing session', error: error.message });
    }
};

