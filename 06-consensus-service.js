const { 
    Client, 
    PrivateKey, 
    TopicCreateTransaction, 
    TopicMessageSubmitTransaction, 
    Hbar 
} = require("@hashgraph/sdk");
require("dotenv").config(".env");

// account 1
const account1PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_1)
const account1Id = process.env.ACCOUNT_ID_1

const client = Client.forTestnet()
    .setOperator(account1Id, account1PvK)
    .setDefaultMaxTransactionFee(new Hbar(10));

async function createTopic() {
    let txResponse = await new TopicCreateTransaction().execute(client);
    let receipt = await txResponse.getReceipt(client);
    return receipt.topicId.toString()
}

async function sendMessage(topicId) {
    const message = new Date().toISOString();

    const response = await new TopicMessageSubmitTransaction({
        topicId,
        message
    }).execute(client);

    let receipt = await response.getReceipt(client);
    console.log(`\nSent message to topic: ${topicId}, message: ${message}`);
    return receipt.status.toString()
}

async function main() {
    let topicId = await createTopic();
    console.log(`Created topic with id: ${topicId}`)
    // give time for topic to create before sending message
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await sendMessage(topicId);
    process.exit()
}

main();