const {
    Client,
    CustomFixedFee,
    CustomRoyaltyFee,
    Hbar,
    PrivateKey,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenMintTransaction,
    TokenSupplyType,
    TokenType,
    TransferTransaction,
    AccountBalanceQuery,
} = require('@hashgraph/sdk');
require('dotenv').config();


async function createNewNft({
    name,
    symbol,
    decimals = 0,
    supply = 0,
    maxSupply = 5,
    treasuryId,
    treasuryPk,
    supplyKey,
    feeCollectorAccountId,
    fallbackFee = 200
}, client) {
    const customFee = new CustomRoyaltyFee({
        numerator: 10,
        denominator: 100,
        feeCollectorAccountId,
        fallbackFee: new CustomFixedFee().setHbarAmount(new Hbar(fallbackFee))
    });

    // create NFT generation transaction
    const createNftTx = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(decimals)
        .setInitialSupply(supply)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(maxSupply)
        .setSupplyKey(supplyKey)
        .setCustomFees([customFee])
        .setMaxTransactionFee(200)
        .freezeWith(client);

    // sign NFT generation transaction
    const createNftTxSign = await createNftTx.sign(treasuryPk);
    // execute NFT creation
    const createNftSubmit = await createNftTxSign.execute(client);
    const tokenId = (await createNftSubmit.getReceipt(client)).tokenId;

    console.log(`Created NFT with Token ID: ${tokenId} \n`);

    return tokenId;
}


async function mintToken(tokenId, supplyKey, amount = 1, client) {
    const receipts = [];

    for await (const iterator of Array.apply(null, Array(amount)).map((x, i) => i)) {
        const mintTx = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setMetadata([Buffer.from([`NFT ${iterator}`])])
            .freezeWith(client);

        const mintTxSign = await mintTx.sign(supplyKey);
        const mintTxSubmit = await mintTxSign.execute(client);
        const mintRx = await mintTxSubmit.getReceipt(client);

        console.log(`Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`);
        receipts.push(mintRx);
    }

    return receipts;
}


async function associateTokenToAccount(tokenId, account, client) {
    // associating token so account3 can use NFT
    const transaction = await new TokenAssociateTransaction()
        .setAccountId(account.id)
        .setTokenIds([tokenId])
        .freezeWith(client)
        .sign(account.privateKey);

    const transactionSubmit = await transaction.execute(client);
    const transactionReceipt = await transactionSubmit.getReceipt(client);

    console.log(`- NFT association with Account3: ${transactionReceipt.status.toString()}\n`);

    return transactionReceipt;
}

async function main() {
    const treasuryAccount = {
        id: process.env.ACCOUNT_ID_1,
        privateKey: PrivateKey.fromString(process.env.PRIVATE_KEY_1),
    };

    const account2 = {
        id: process.env.ACCOUNT_ID_2,
        privateKey: PrivateKey.fromString(process.env.PRIVATE_KEY_2),
    };

    const account3 = {
        id: process.env.ACCOUNT_ID_3,
        privateKey: PrivateKey.fromString(process.env.PRIVATE_KEY_3),
    }

    const supplyKey = PrivateKey.generateED25519();

    const client = Client.forTestnet().setOperator(treasuryAccount.id, treasuryAccount.privateKey);

    const tokenId = await createNewNft({
        name: 'Carlos Coin',
        symbol: 'CC',
        decimals: 0,
        supply: 0,
        maxSupply: 5,
        treasuryId: treasuryAccount.id,
        treasuryPk: treasuryAccount.privateKey,
        supplyKey,
        feeCollectorAccountId: account2.id,
        fallbackFee: 200,
    }, client);

    const newlyMintedNfts = await mintToken(tokenId, supplyKey, 5, client);

    console.log({ newlyMintedNfts, supplyKey: supplyKey.toStringRaw() })

    await associateTokenToAccount(tokenId, account3, client);

    const tokenTransferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, 2, treasuryAccount.id, account3.id)
        .freezeWith(client)
        .sign(treasuryAccount.privateKey);

    const tokenTransferSubmit = await tokenTransferTx.execute(client);

    const tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

    console.log(`\n- NFT transfer from Treasury to Account3: ${tokenTransferRx.status} \n`);

    const treasuryBalance = await new AccountBalanceQuery().setAccountId(treasuryAccount.id).execute(client);
    console.log(`- Treasury balance: ${treasuryBalance.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`);

    const account3Balance = await new AccountBalanceQuery().setAccountId(account3.id).execute(client);
    console.log(`- Account3 balance: ${account3Balance.tokens._map.get(tokenId.toString())} NFTs of ID ${tokenId}`);
}

main();