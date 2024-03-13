require('dotenv').config();
const express = require('express');
const db = require('./db');
const routes = require('./routes');
const cors = require('cors');
const app = express();

app.use(express.json());

app.use(cors());
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Hello World');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await db.connectToDatabase();
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}
);

