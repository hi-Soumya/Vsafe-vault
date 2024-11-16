const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Store data in memory (replace with database in production)
let dataStore ;

// POST endpoint to store data
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        
        // Add an ID to the data
        newData.id = Date.now();
        
        // Store the data
        dataStore = newData;
        
        res.status(201).json({
            message: 'Data stored successfully',
            data: newData
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error storing data',
            error: error.message
        });
    }
});

// GET endpoint to retrieve all data
app.get('/api/data', (req, res) => {
    try {
        res.status(200).json({
            message: 'Data retrieved successfully',
            data: dataStore
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving data',
            error: error.message
        });
    }
});



// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});