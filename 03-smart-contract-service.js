const {
    PrivateKey,
    Client,
    Hbar,
    ContractCreateFlow,
    ContractExecuteTransaction,
    ContractFunctionParameters,
} = require("@hashgraph/sdk");
require('dotenv').config();

// account 1
const account1PvK = PrivateKey.fromString(process.env.PRIVATE_KEY_1)
const account1Id = process.env.ACCOUNT_ID_1

// throw error if acconut ids or private keys don't exist
if (!account1PvK || !account1Id) {
    throw new Error('Environment variables for specified accounts must be present');
}

const client = Client.forTestnet();
client.setOperator(account1Id, account1PvK);
// set max transaction fee willing to spend
client.setDefaultMaxTransactionFee(new Hbar(100));

// import existing smart contract
const contractJson = require("./CertificationC1.json");

async function deployContract() {
    // deploying smart contract
    const contractTx = await new ContractCreateFlow()
        .setBytecode(contractJson.bytecode)
        .setGas(100_000)
        .execute(client);

    const contractId = (await contractTx.getReceipt(client)).contractId;
    console.log("Deployed contract with ID: ", contractId)
    return contractId
}

async function interactWithContractFunction1(contractId) {
    // send transaction to interact with "function1" on smart contract with input parameters 3 and 4
    const tx = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(100_000)
        .setFunction("function1", new ContractFunctionParameters().addUint16(4).addUint16(3))
        .execute(client);

    // get result from tx
    let record = await tx.getRecord(client);
    // parse result to get clean data
    return Buffer.from((record).contractFunctionResult.bytes).toJSON().data.at(-1)
}

async function interactWithContractFunction2(contractId, n) {
    // send transaction to interact with "function2" on smart contract with input parameter from output of "function1"
    const tx = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(100_000)
        .setFunction("function2", new ContractFunctionParameters().addUint16(n))
        .execute(client);

    // get result from tx
    let record = await tx.getRecord(client);
    // parse result to get clean data
    return Buffer.from((record).contractFunctionResult.bytes).toJSON().data.at(-1)
}

async function main() {
    let contractId = await deployContract();
    // let contractId = 0.0.3904947
    let result1 = await interactWithContractFunction1(contractId);
    let result2 = await interactWithContractFunction2(contractId, result1);

    console.log("Result from function1: ", result1)
    console.log("Result from function2: ", result2)

    process.exit()
}

main()
