import { sleep } from 'tronweb/utils';
import { readFile } from 'fs/promises';
import { setNetwork, deploy, initialBuy, getTokenBalance, sellToken } from './launch.js';
import { TronWeb } from 'tronweb';
import { FULL_NODE, NILE_FULL_NODE } from './tronConst.js';

async function readJSONFile(jsonPath) {
    try {
        const data = await readFile(jsonPath, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing the file:', err);
    }
}

async function main() {
    console.log("=====================================================");
    console.log("Let's create token First...");

    const networkMode = "niletestnet"; // option "mainnet", "niletestnet"
    setNetwork(networkMode)
    // await sellToken('TVRdF19z4GpAtuncTENPtUVjA2Ysvtv1eM', 'TMn1qrmYUMSTXo9babrJLzepKZoPC7M6Sy',
    //     'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a', '876fec6dea14d8d94aa44467af5369df9a25c12f642183886a02c0923a9352c2')
    // await sellToken('TVRdF19z4GpAtuncTENPtUVjA2Ysvtv1eM', 'TMn1qrmYUMSTXo9babrJLzepKZoPC7M6Sy',
    //     'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a', '7023f02189c894cdeb5467824dec713c8eb8258a0e68c8fc9e92fe8330b9e2ba')
    await sellToken('TVRdF19z4GpAtuncTENPtUVjA2Ysvtv1eM', 'TMn1qrmYUMSTXo9babrJLzepKZoPC7M6Sy',
        'TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a', 'b2ee4b6231b8d0f840ed2d56a461112d20ee87751933dadacfef7527f45475a4')
    return

    let tronWeb;
    if (networkMode === "mainnet") {
        tronWeb = new TronWeb({
            fullHost: FULL_NODE
        });
    }
    else if (networkMode === "niletestnet") {
        tronWeb = new TronWeb({
            fullHost: NILE_FULL_NODE
        });
    }

    const args = await readJSONFile('./src/args.json');

    let deployRequest = [];
    const deployArg = {
        "name": args[0].name,
        "symbol": args[0].symbol,
        "totalSupply": args[0].totalSupply,
        "ownerKey": args[0].ownerKey,
        "buyerKeys": args[0].buyerKeys
    }

    deployRequest.push(deployArg);

    const ownerPubKey = tronWeb.address.fromPrivateKey(deployRequest[0].ownerKey)

    console.log(`Owner : ${ownerPubKey}`);
    console.log(`Token Name : ${deployRequest[0].name}`);
    console.log(`Token Symbol : ${deployRequest[0].symbol}`);

    console.log(`Creating Tokens ...`);
    console.log(`Deploying Tokens ...`);

    const tokenAddress = await deploy(deployRequest);
    await sleep(6000);

    // const tokenAddress = 'TRodFLefsPRoxWwQ4uRBw66YvueDBsogys'
    console.log(`Done !\n`);
    console.log(`Token Address : ${tokenAddress}`);

    console.log(`==========================================================`);
    console.log(`Add liquidity & Initial buying with bundling.`);

    let initalBuyRequest = [];
    const initialBuyArg = {
        "tokenAddress": tokenAddress,
        "ownerKey": args[0].ownerKey,
        "liquidityEth": args[0].liquidityEth,
        "buyerKeys": args[0].buyerKeys,
        "min": args[0].min,
        "max": args[0].max
    }
    initalBuyRequest.push(initialBuyArg);

    const walletCount = initalBuyRequest[0].buyerKeys.length;
    console.log(`Wallet Count: ${walletCount}`);

    for (let i = 0; i < walletCount; i++) {
        const buyerPubKey = tronWeb.address.fromPrivateKey(initalBuyRequest[0].buyerKeys[i]);
        const trxAmounts = await tronWeb.trx.getBalance(buyerPubKey);
        console.log(`Wallet ${i} : ${buyerPubKey}, ${trxAmounts} TRX`);
    }

    console.log(`Start Bundling ...`);
    console.log(`TRX for liquidity : ${initalBuyRequest[0].liquidityEth} TRX`);
    const tokenAmount = deployRequest[0].totalSupply / (10 ** 18);
    console.log(`Total supply : ${tokenAmount}`);

    console.log(`Starting Timer...`);
    const txIds = await initialBuy(initalBuyRequest);
    for (let i = 0; i < walletCount; i++) {
        const buyerPubKey = tronWeb.address.fromPrivateKey(initalBuyRequest[0].buyerKeys[i]);
        const trxAmounts = await tronWeb.trx.getBalance(buyerPubKey);
        const tokenAmounts = await getTokenBalance(tokenAddress, buyerPubKey);
        console.log(`Wallet ${i} : ${buyerPubKey}, ${trxAmounts} TRX, ${tokenAmount / (10 ** 18)}`);
    }
}

main();
