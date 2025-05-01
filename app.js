const express = require('express');
const mongoose = require("mongoose");
const { Mutex, withTimeout, E_TIMEOUT } = require("async-mutex");

const app = express();
const PORT = 3000;
const accountMutex = withTimeout(new Mutex(), 5000);

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
    if (account) account.balance = 1000;
    else account = new Account({ _id: 1, balance: 1000 });
    account.save();
    console.log(account);
});

Account.findById(2)
.then(account => {
    if (account) account.balance = 1000;
    else account = new Account({ _id: 2, balance: 1000 });
    account.save();
    console.log(account);
});

// Function to simulate a race condition by directly manipulating account balance without synchronization
async function handleDeposit(amount, accountNum) {
    await accountMutex.runExclusive(async () => {
        console.log(`Depositing $${amount}`);
        let account = await Account.findOne({ "_id": accountNum });
        account.balance += amount;
        console.log(account.balance);
        account.save();
    });
}

async function handleDeposit2(amount, accountNum) {
    console.log(accountMutex.isLocked())
    const release = await accountMutex.acquire();
    console.log(accountMutex.isLocked())
    release();
    console.log(accountMutex.isLocked())
    let release2;
    try {
        release2 = await accountMutex.acquire();
    } catch (E_TIMEOUT) {
        console.log("Took too long to unlock")
    } finally {
        release2();
    }
    
    try {
        console.log(`Depositing $${amount}`);
        let account = await Account.findOne({ "_id": accountNum });
        account.balance += amount;
        console.log(account.balance);
        account.save();
        // throw Error;
    } catch (error) {
        console.log(error);
        // throw Error;
    } finally {
        release();
        console.log("Finally")
    }
    console.log("After")
    release();
}

async function handleWithdrawal(amount, accountNum) {
    await accountMutex.runExclusive(async () => {
        console.log(`Withdrawing $${amount}`);
        let account = await Account.findOne({ "_id": accountNum });
        account.balance -= amount;
        console.log(account.balance);
        account.save();
    });
}

async function handleTransfer(amount, sender, recipiant) {
    await accountMutex.runExclusive(async () => {
        await handleWithdrawal(amount, sender);
        for (let i=0; i<1000000000; i++) {
            i*i;
        }
        await handleDeposit(amount, recipiant)
        // setTimeout(async () => {
            
        // }, 5000)
        // handleDeposit(amount, recipiant);
    });
}

// Deposit route
// eg http://localhost:3000/deposit?amount=100
app.get('/deposit', async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    const accountNum = parseInt(req.query.id, 10) || 0;
    // Simulate a race condition by directly modifying the balance without synchronization
    handleDeposit2(amount, accountNum);
    res.send(`Deposited $${amount}.`);
});

// Withdrawal route
app.get('/withdraw', async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    // Simulate a race condition by directly modifying the balance without synchronization
    handleWithdrawal(amount);
    res.send(`Withdrew $${amount}`);
});

app.get("/transfer", async (req, res) => {
    const amount = parseInt(req.query.amount, 10) || 0;
    const sender = parseInt(req.query.sender, 10) || 0;
    const recipiant = parseInt(req.query.recipiant, 10) || 0;
    handleTransfer(amount, sender, recipiant);
    res.send("Success!");
})

app.get('/balance', async (req, res) => {
    let account = await Account.findOne({ "_id": 1 });
    res.send(`Current balance: $${account.balance}`);
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

/*
https://www.facebook.com/login.php?
skip_api_login=1&
api_key=113289095462482&kid_directed_site=0&
app_id=113289095462482&
signed_next=1&
next=https%3A%2F%2Fwww.facebook.com%2Fv18.0%2Fdialog%2Foauth%3Fresponse_type%3Dcode%26client_id%3D113289095462482%26scope%3Demail%252Cpublic_profile%26redirect_uri%3Dhttps%253A%252F%252Fzoom.us%252Ffacebook%252Foauth%26state%3DVmpGdmNjV1BUWGVIODFMdlJ2UFE3QSxmYWNlYm9va19zaWduaW4%26ret%3Dlogin%26fbapp_pres%3D0%26logger_id%3D86e05f29-ebfd-4ba1-8906-4bd56d3ee87b%26tp%3Dunspecified&
cancel_url=https%3A%2F%2Fzoom.us%2Ffacebook%2Foauth%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3DVmpGdmNjV1BUWGVIODFMdlJ2UFE3QSxmYWNlYm9va19zaWduaW4%23_%3D_&
display=page&
locale=en_US&
pl_dbl=0

*/