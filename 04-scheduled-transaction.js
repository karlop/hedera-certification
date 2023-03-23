const {
    PrivateKey,
    Transaction,
    TransferTransaction,
    Hbar,
    ScheduleCreateTransaction,
    Client
} = require("@hashgraph/sdk")
require('dotenv').config()

// account 1
const account1PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_1)
const account1Id = process.env.ACCOUNT_ID_1

// account 2
const account2Pvk = PrivateKey.fromString(process.env.PRIVATE_KEY_2)
const account2Id = process.env.ACCOUNT_ID_2

// throw error if acconut ids or private keys don't exist
if (!account1PvK || !account1Id || !account2Pvk || !account2Id) {
    throw new Error('Environment variables for specified accounts must be present');
}

const client = Client.forTestnet();
client.setOperator(account1Id, account1PvK);

async function scheduleTransaction(from, to, amount, fromPrivateKey) {
    // create transfer transaction: 10Hbar from account 1 to account 2
    const tx = new TransferTransaction()
        .addHbarTransfer(from, new Hbar(`-${amount}`))
        .addHbarTransfer(to, new Hbar(amount));

    // create schedule transaction
    const txBytes = new ScheduleCreateTransaction()
        .setScheduledTransaction(tx)
        .setAdminKey(fromPrivateKey)
        .freezeWith(client)
        .toBytes();

    // convert to base64 format
    const base64Tx = Buffer.from(txBytes).toString('base64');
    console.log(`Base64 encoded tx: ${base64Tx}`)
    return base64Tx
}

async function deserializeTransaction(base64Tx) {
    // create transaction from bytes
    const tx = await Transaction.fromBytes(Buffer.from(base64Tx, 'base64'))
        .sign(account1PvK);

    // execute transaction
    await tx.execute(client)
    console.log(`\nTransaction: ${tx.transactionId}`)
}

async function main() {
    const serializedTx = await scheduleTransaction(account1Id, account2Id, 10, account1PvK);
    await deserializeTransaction(serializedTx);
    process.exit()
}

main()