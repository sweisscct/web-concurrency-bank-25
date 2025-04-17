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

function resetOrCreateAccount(accountId) {
    Account.findById(accountId)
    .then(account => {
        if (account) account.balance = 0;
        else account = new Account({ _id: accountId, balance: 0 });
        account.save();
        console.log(account);
    });
}
resetOrCreateAccount(1);
resetOrCreateAccount(2);

// Function to simulate a race condition by directly manipulating account balance without synchronization
async function handleDeposit(amount, id) {
    console.log(`Depositing $${amount}`);
    let account = await Account.findOne({ "_id": id });
    account.balance += amount;
    console.log(account.balance);
    account.save();
}

async function handleWithdrawal(amount, id) {
    console.log(`Withdrawing $${amount}`);
    let withdrawalSucess = false;
    let account = await Account.findOne({ "_id": id });
    if (account.balance >= amount) {
        account.balance -= amount;
        withdrawalSucess = true;
    }
    else console.log("Sorry, not enoung money :(");
    console.log(account.balance);
    account.save();
    return withdrawalSucess;
}

async function handleTransfer(amount, sender, recipiant) {
    if (handleWithdrawal(amount, sender)) {
        handleDeposit(amount, recipiant);
    }
}

app.get("/transfer", (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    const sender = parseInt(req.query.sender, 10) || 0;
    const recipiant = parseInt(req.query.recipiant, 10) || 0;

    if (sender && recipiant) {
        handleTransfer(amount, sender, recipiant);
        res.send(`Transfered ${amount} from ${sender} to "${recipiant}`);
    } else res.send("Error in transfer");
})

// Deposit route
// eg http://localhost:3000/deposit?amount=100&id=1
app.get('/deposit', async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    // Simulate a race condition by directly modifying the balance without synchronization
    const id = parseInt(req.query.id, 10) || 0;
    if (id) {
        handleDeposit(amount, id);
        res.send(`Deposited $${amount}.`);
    } else res.send("Account not found");
});

// Withdrawal route
// eg http://localhost:3000/withdraw?id=2&amount=100
app.get('/withdraw', async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    const id = parseInt(req.query.id, 10) || 0;
    if (id) {
        // Simulate a race condition by directly modifying the balance without synchronization
        handleWithdrawal(amount, id);
        res.send(`Withdrew $${amount}`);
    } else res.send("Account not found");
});

app.get('/balance', async (req, res) => {
    let account = await Account.findOne({ "_id": 1 });
    res.send(`Current balance: $${account.balance}`);
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
