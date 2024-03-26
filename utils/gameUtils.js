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

module.exports = {
    parseGameInfo
};