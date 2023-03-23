const {
    Client,
    PrivateKey,
    KeyList,
    AccountCreateTransaction,
    TransferTransaction,
    Hbar,
    AccountBalanceQuery,
} = require("@hashgraph/sdk");

require("dotenv").config(".env");

const myAccountId = process.env.MY_ACCOUNT_ID;
const myAccountPvK = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

const accountId1 = process.env.ACCOUNT_ID_1;
const account1PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_1);

const accountId2 = process.env.ACCOUNT_ID_2;
const account2PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_2);

const accountId3 = process.env.ACCOUNT_ID_3;
const account3PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_3);

const accountId4 = process.env.ACCOUNT_ID_4;
const account4PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_4);

if (
    !accountId1 ||
    !account1PvK ||
    !accountId2 ||
    !account2PvK ||
    !accountId3 ||
    !account3PvK ||
    !accountId4 ||
    !account4PvK
) {
    throw new Error(
        "Environment variables missing"
    );
}
let publicKeys = [
    account1PvK.publicKey,
    account2PvK.publicKey,
    account3PvK.publicKey,
];
let tresholdKey = new KeyList(publicKeys, 2);

const client = Client.forTestnet();
client.setOperator(myAccountId, myAccountPvK);

async function main() {
    const newAccount = await new AccountCreateTransaction()
        .setKey(tresholdKey)
        .setInitialBalance(new Hbar(20))
        .execute(client);

    const receit = await newAccount.getReceipt(client);
    const multiple_account_id = receit.accountId;

    // trying to send 10Hbar with only account 1 signed
    const transaction = await new TransferTransaction()
        .addHbarTransfer(multiple_account_id, new Hbar(-10))
        .addHbarTransfer(accountId4, new Hbar(10))
        .freezeWith(client)
        .sign(account1PvK);

    console.log(`Transfering 10Hbar from ${multiple_account_id} to ${accountId4} with 1 signature`);
    try {
        const txId = await transaction.execute(client);

        // Request the receipt of the transaction
        const receipt = await txId.getReceipt(client);
        const transactionStatus = receipt.status;

        console.log("The transactionx status is " + transactionStatus);
    } catch (err) {
        console.log("\n- Could not complete transaction");
    }

    // trying to send 10Hbar with 2 signagtures
    const transaction2 = await (
        await new TransferTransaction()
            .addHbarTransfer(multiple_account_id, new Hbar(-10))
            .addHbarTransfer(accountId4, new Hbar(10))
            .freezeWith(client)
            .sign(account1PvK)
    ).sign(account2PvK);

    console.log(`Transferring 10Hbar from ${multiple_account_id} to ${accountId4} with 2 signatures`);

    try {
        const txId = await transaction2.execute(client);

        // Request the receipt of the transaction
        const receipt = await txId.getReceipt(client);
        const transactionStatus = receipt.status;

        console.log("The transaction status is " + transactionStatus);
        
    } catch (err) {
        console.log("\n- Could not complete transaction");
    }

    const queryMultiple = new AccountBalanceQuery().setAccountId(
        multiple_account_id
    );
    const queryOther = new AccountBalanceQuery().setAccountId(accountId4);

    const accountBalanceMultiple = await queryMultiple.execute(client);
    const accountBalanceOther = await queryOther.execute(client);

    console.log(
        `Multiple account balance ${accountBalanceMultiple.hbars} HBar, other account balance ${accountBalanceOther.hbars}`
    );

    process.exit();
}
main();