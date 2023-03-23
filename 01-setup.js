const {
    AccountCreateTransaction,
    Client,
    PrivateKey,
    Hbar
} = require('@hashgraph/sdk');
require('dotenv').config()

async function main() {
    // use existing account from .env
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // throw error if acconut id or private key doesn't exist
    if (!myAccountId || !myPrivateKey) {
        throw new Error('Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present');
    }

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // loop 5 times to create 5 accounts
    for (let i = 1; i <= 5; i++) {
        //generate private and public keys
        const newAccountPrivateKey = PrivateKey.generateED25519();
        const newAccountPublicKey = newAccountPrivateKey.publicKey;

        // create new account transaction with 700Hbar and execute it
        const newAccount = await new AccountCreateTransaction()
            .setKey(newAccountPublicKey)
            .setInitialBalance(new Hbar(700))
            .execute(client);

        // get account id
        const getReceipt = await newAccount.getReceipt(client);
        const newAccountId = getReceipt.accountId;

        console.log(`ACCOUNT_ID_${i} = ${newAccountId.toString()}`);
        console.log(`PUBLIC_KEY_${i} = ${newAccountPublicKey.toString()}`);
        console.log(`PRIVATE_KEY_${i} = ${newAccountPrivateKey.toString()}`);
        console.log('\n')
    }

    process.exit();
}

main();