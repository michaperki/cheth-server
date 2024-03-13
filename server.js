const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());

// Allow requests only from localhost:3000 during development
const corsOptions = {
  origin: 'http://localhost:3000',
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});