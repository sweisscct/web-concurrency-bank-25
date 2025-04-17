const express = require('express');
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/bank');

// Define how the account will be stored in MongoDB
const accountSchema = new mongoose.Schema({
    _id: Number,
    balance: Number
  });
const Account = mongoose.model('Account', accountSchema);

// Checks to see if the account already exists in the database.
// If the account exists, set the balance to 0;
Account.findById(1)
.then(account => {
    if (account) account.balance = 0;
    else account = new Account({ _id: 1, balance: 0 });
    account.save();
    console.log(account);
});

// Function to simulate a race condition by directly manipulating account balance without synchronization
async function handleDeposit(amount) {
    console.log(`Depositing $${amount}`);
    const result = await Account.findOneAndUpdate(
        { _id: 1 },
        { $inc: { balance: amount } },
        { new: true }
    )
    console.log(result.balance);

    // let account = await Account.findOne({ "_id": 1 });
    // account.balance += amount;
    // console.log(account.balance);
    // account.save();
}

async function handleWithdrawal(amount) {
    console.log(`Withdrawing $${amount}`);
    let account = await Account.findOne({ "_id": 1 });
    if (account.balance >= amount) account.balance -= amount;
    else console.log("Sorry, not enoung money :(");
    console.log(account.balance);
    account.save();
}

// Deposit route
// eg http://localhost:3000/deposit?amount=100
app.get('/deposit', async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    // Simulate a race condition by directly modifying the balance without synchronization
    handleDeposit(amount);
    res.send(`Deposited $${amount}.`);
});

// Withdrawal route
app.get('/withdraw', async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    // Simulate a race condition by directly modifying the balance without synchronization
    handleWithdrawal(amount);
    res.send(`Withdrew $${amount}`);
});

app.get('/balance', async (req, res) => {
    let account = await Account.findOne({ "_id": 1 });
    res.send(`Current balance: $${account.balance}`);
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
