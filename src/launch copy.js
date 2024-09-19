import { tokenContract } from './token.js';
import { send_raw_bundle, setTronWeb } from './bundle.js';
import { NILE_SUNSWAPV2_ROUTER_ADDRESS, SUNSWAPV2_ROUTER_ADDRESS, WTRX_ADDRESS, NILE_WTRX_ADDRESS, WTRX_DECIMALS, TOKEN_DECIMALS } from './tronConst.js';
import { utils as ethersUtils } from "ethers";
import { TronWeb } from 'tronweb';
import { FULL_NODE, NILE_FULL_NODE } from './tronConst.js';

let networkMode;
let tronWeb;

async function setMode(mode, tokenAddress, privateKey) {
    // Parameters for the setMode function
    const parametersSetMode = [
        { type: 'uint256', value: mode } // Amount to transfer
    ];

    const ownerPubKey = tronWeb.address.fromPrivateKey(privateKey)

    // Options
    const optionsSetMode = {
        feeLimit: 100000000, // Example fee limit in SUN
        callValue: 0, // Example call value, in this case, 0 TRX
        tokenValue: 0 // No token being transferred
    };
    try {
        let resultSetMode;
        try {
            resultSetMode = await tronWeb.transactionBuilder.triggerSmartContract(
                tokenAddress,
                'setMode(uint256)', // Function selector
                optionsSetMode,
                parametersSetMode,
                ownerPubKey
            );
        } catch (error) {
            console.error('Error setMode(transaction build):', error);
            return error;
        }

        // Sign the transaction
        try {
            const signedTransactionSetMode = await tronWeb.trx.sign(resultSetMode.transaction, privateKey);
            return signedTransactionSetMode;
        } catch (error) {
            console.error('Error setMode(sign transaction):', error);
            return error;
        }
    }
    catch (err) {
        console.error('Error setMode:', err);
        return err;
    }
}

async function approve(tokenAddress, address, amount, privateKey) {
    const parametersApprove = [
        { type: 'address', value: address }, // spender address
        { type: 'uint256', value: amount } // Amount to approve
    ];

    const ownerPubKey = tronWeb.address.fromPrivateKey(privateKey)
    // Options
    const optionsApprove = {
        feeLimit: 100000000, // Example fee limit in SUN
        callValue: 0, // Example call value, in this case, 0 TRX
        tokenValue: 0 // No token being transferred
    };
    try {
        let resultApprove;
        try {
            resultApprove = await tronWeb.transactionBuilder.triggerSmartContract(
                tokenAddress,
                'approve(address, uint256)', // Function selector
                optionsApprove,
                parametersApprove,
                ownerPubKey
            );
        } catch (error) {
            console.error('Error approve(build transaction):', error);
            return error;
        }

        // Sign the transaction
        try {
            const signedTransactionApprove = await tronWeb.trx.sign(resultApprove.transaction, privateKey);
            return signedTransactionApprove;
        } catch (error) {
            console.error('Error approve(sign transaction):', error);
            return error;
        }
    } catch (error) {
        console.error('Error approve:', error);
        return error;
    }
}

async function buyToken(tokenAddress, routerAddress, WTRXAddress, privateKey) {
    const pubKey = tronWeb.address.fromPrivateKey(privateKey);
    const trxAmounts = await tronWeb.trx.getBalance(pubKey)
    const sellTrx = trxAmounts - tronWeb.toSun(100);
    console.log('sellTrx: ', sellTrx)
    const DEADLINEBUY = Math.floor(Date.now() / 1000) + 60 * 20;
    // Parameters
    const parametersSwap = [
        { type: 'uint256', value: 0 }, // min amount token
        { type: 'address[]', value: [WTRXAddress, tokenAddress] }, // path
        { type: 'address', value: routerAddress }, // router address
        { type: 'uint256', value: DEADLINEBUY }, // deadline
    ];

    // Options
    const optionsSwap = {
        feeLimit: 5000000000, // Example fee limit in SUN
        callValue: sellTrx, // Example call value, in this case, 0 TRX
        tokenValue: 0 // No token being transferred
    };
    try {
        let resultSwap;
        try {
            resultSwap = await tronWeb.transactionBuilder.triggerSmartContract(
                routerAddress,
                'swapExactETHForTokens(uint256, address[], address, uint256)', // Function selector
                optionsSwap,
                parametersSwap,
                pubKey
            );
        } catch (error) {
            console.error('Error buyToken(build transaction):', error);
            return error;
        }

        // Sign the transaction
        try {
            const signedTransactionSwap = await tronWeb.trx.sign(resultSwap.transaction, privateKey);
            return signedTransactionSwap;
        } catch (error) {
            console.error('Error buyToken(sign transaction):', error);
            return error;
        }
    } catch (error) {
        console.error('Error buyToken:', error);
        return error;
    }
}

function getRouterAddress(networkMode) {
    let routerAddress;
    let wtrxAddress;
    if (networkMode === "mainnet") {
        routerAddress = SUNSWAPV2_ROUTER_ADDRESS;
        wtrxAddress = WTRX_ADDRESS;
    }
    else if (networkMode === "niletestnet") {
        routerAddress = NILE_SUNSWAPV2_ROUTER_ADDRESS;
        wtrxAddress = NILE_WTRX_ADDRESS;
    }
    return {router: routerAddress, wtrx: wtrxAddress}
}

export function setNetwork(_networkMode) {
    networkMode = _networkMode
    if (networkMode === "mainnet") {
        tronWeb = new TronWeb({
            fullHost: FULL_NODE,
            privateKey: 'c773f4960a803af66cceb5bc4e8ec2c975b37312f5dabdaea3c6548c8c6b84c6'
        });
    }
    else if (networkMode === "niletestnet") {
        tronWeb = new TronWeb({
            fullHost: NILE_FULL_NODE,
            privateKey: 'c773f4960a803af66cceb5bc4e8ec2c975b37312f5dabdaea3c6548c8c6b84c6'
        });
    }
    setTronWeb(networkMode)
}

export async function deploy(request) {
    const name = request[0].name
    const symbol = request[0].symbol
    const totalSupply = request[0].totalSupply
    let buyerKeys = []
    tronWeb.setPrivateKey(request[0].ownerKey)

    for (let i = 0; i < request[0].buyerKeys.length; i++) {
        const pubKey = tronWeb.address.fromPrivateKey(request[0].buyerKeys[i])
        const hexAddress = tronWeb.address.toHex(pubKey);
        const convertedHex = ethersUtils.getAddress(hexAddress.substring(2));
        buyerKeys.push(convertedHex)
    }

    try {
        const bytecode = tokenContract.bytecode;  // Replace this with your actual bytecode
        const abi = tokenContract.abi;  // Replace this with your actual ABI
        const contract = await tronWeb.contract().new({
            abi: abi,
            bytecode: bytecode,
            feeLimit: 1000000000, // adjust based on your needs
            callValue: 0, // if you want to send TRX to the contract, adjust this
            userFeePercentage: 30,
            originEnergyLimit: 10000000,
            parameters: [name, symbol, totalSupply, buyerKeys], // initial supply in wei
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(tronWeb.address.fromHex(contract.address));
            }, 1000);
        })
    } catch (err) {
        console.error('Error deploying contract:', err);
        return err;
    }
}

export async function getTokenBalance(tokenAddress, address) {
    try {
        let contract = await tronWeb.contract().at(tokenAddress);
        //Use call to execute a pure or view smart contract method.
        // These methods do not modify the blockchain, do not cost anything to execute and are also not broadcasted to the network.
        console.log("--------------", tokenAddress, address)
        let balance = await contract.balanceOf(address).call()
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(balance);
            }, 1);
        })
    } catch (error) {
        console.error("trigger smart contract error", error)
    }
}

export async function disperseTrx(ownerKey, zombieWallets, min, max, trxMaxTotalInitialBuyAmount) {
    const ownerPubKey = tronWeb.address.fromPrivateKey(ownerKey)
    console.log(ownerKey)
    console.log(ownerPubKey)
    const zombieWalletSize = zombieWallets.length;
    let randomAmounts = []
    let trxTotalInitialBuyAmount = 0
    for (let i = 0; i < zombieWalletSize; i++) {
        while (true) {
            const rand = Math.random();
            const randomPercent = rand * 100;
            if (randomPercent <= max & randomPercent >= min) {
                const initalBuyAmount = Math.floor(trxMaxTotalInitialBuyAmount * rand)
                randomAmounts.push(initalBuyAmount)
                trxTotalInitialBuyAmount += initalBuyAmount
                break
            }
        }
    }

    console.log("Real TRX amount for initialBuy: ", trxTotalInitialBuyAmount)

    console.log("Disperse TRX to zombie wallets...")
    for (let i = 0; i < zombieWalletSize; i++) {
        const tx = await tronWeb.transactionBuilder.sendTrx(zombieWallets[i], randomAmounts[i], ownerPubKey);
        const signedTx = await tronWeb.trx.sign(tx, ownerKey);
        const transaction = await tronWeb.trx.sendRawTransaction(signedTx);
    }
    return trxTotalInitialBuyAmount
}

export async function addLiquidity(request) {
    const tokenAddress = request[0].tokenAddress
    const ownerKey = request[0].ownerKey
    const liquidityEth = request[0].liquidityEth

    const ownerPubKey = tronWeb.address.fromPrivateKey(ownerKey)
    const trxOwnerAmounts = await tronWeb.trx.getBalance(ownerPubKey)
    if (trxOwnerAmounts < 2 * liquidityEth) {
        console.log("Not enough TRX to initalBuy!")
        return null;
    }

    let tokenAmount
    try {
        tokenAmount = await getTokenBalance(tokenAddress, ownerPubKey)
    } catch (error) {
        console.log(`token doesn't exist in owner wallet!`)
        return false
    }

    const {router: routerAddress, wtrx: wtrxAddress} = getRouterAddress(networkMode)
    // call setMode 2
    try {
        const txSetMode2 = await setMode(2, tokenAddress, ownerKey)
        bundle_txs.push(txSetMode2)
    } catch (error) {
        console.log(`set mode failed: ${error}`)
        return false
    }

    // Call approve
    try {
        const txApprove = await approve(tokenAddress, routerAddress, tokenAmount, ownerKey)
        bundle_txs.push(txApprove)
    } catch (error) {
        console.log(`approve failed: ${error}`)
        return false
    }

    const pubKey = tronWeb.address.fromPrivateKey(privateKey);
    const AMOUNT_TRX_DESIRED = tronWeb.toSun(TRXAmount);
    const DEADLINEAddLiquidity = Math.floor(Date.now() / 1000) + 60 * 20;
    // Parameters
    const parametersAddLiquidity = [
        { type: 'address', value: tokenAddress }, // token address
        { type: 'uint256', value: tokenAmount }, // Amount token desired
        { type: 'uint256', value: 0 }, // Amount token minimum
        { type: 'uint256', value: 0 }, // Amount Eth min
        { type: 'address', value: pubKey }, // to address
        { type: 'uint256', value: DEADLINEAddLiquidity }, // deadline
    ];

    // Options
    const optionsAddLiquidity = {
        feeLimit: 5000000000, // Example fee limit in SUN
        callValue: AMOUNT_TRX_DESIRED, // Example call value, in this case, 0 TRX
        tokenValue: 0 // No token being transferred
    };

    try {
        let resultAddLiquidity;
        try {
            resultAddLiquidity = await tronWeb.transactionBuilder.triggerSmartContract(
                routerAddress,
                'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)', // Function selector
                optionsAddLiquidity,
                parametersAddLiquidity,
                pubKey
            );
        } catch (error) {
            console.error('Error addLiquidityETH(build transaction):', error);
            return error;
        }

        // Sign the transaction
        try {
            const signedTransactionAddLiquidity = await tronWeb.trx.sign(resultAddLiquidity.transaction, privateKey);
            return signedTransactionAddLiquidity;
        } catch (error) {
            console.error('Error addLiquidityETH(sign transaction):', error);
            return error;
        }
    } catch (error) {
        console.error('Error addLiquidity:', error);
        return error;
    }
}

export async function initialBuy(request) {
    const tokenAddress = request[0].tokenAddress
    const ownerKey = request[0].ownerKey
    const buyerKeys = request[0].buyerKeys
    const min = request[0].min
    const max = request[0].max
    const zombieWalletSize = buyerKeys.length

    if (zombieWalletSize < 1) {
        console.log("Not exist zombie wallets!")
        return null
    }

    if ((zombieWalletSize * max / 100) >= 1) {
        console.log("Wrong setting buy percent")
        return null
    }

    const ownerPubKey = tronWeb.address.fromPrivateKey(ownerKey)
    const trxOwnerAmounts = await tronWeb.trx.getBalance(ownerPubKey)

    const trxMaxTotalInitialBuyAmount = trxOwnerAmounts - zombieWalletSize * 150
    if (trxMaxTotalInitialBuyAmount < 0) {
        console.log(`Insufficient amount to initial buy: ${trxMaxTotalInitialBuyAmount}`)
        return false
    }
    console.log("Possible TRX amount for initialBuy: ", trxMaxTotalInitialBuyAmount)

    const zombieWallets = [];
    for (let i = 0; i < zombieWalletSize; i++) {
        const zombieKey = tronWeb.address.fromPrivateKey(buyerKeys[i])
        zombieWallets.push(zombieKey)
    }

    try {
        const trxTotalInitialBuyAmount = await disperseTrx(ownerKey, zombieWallets, min, max, trxMaxTotalInitialBuyAmount)
    } catch (error) {
        console.log(`disperse TRX failed: ${error}`)
        return false
    }

    const {router: routerAddress, wtrx: wtrxAddress} = getRouterAddress(networkMode)

    try {
        let bundle_txs = []
        try {
            const txAddLiquidity = await addLiquidity(tokenAddress, routerAddress, tokenAmount, liquidityEth, ownerKey)
            bundle_txs.push(txAddLiquidity.txID)
            console.log(txAddLiquidity)
        } catch (error) {
            console.log(`add liquidity failed: ${error}`)
            return false
        }

        for (let i = 0; i < buyerKeys.length; i++) {
            try {
                const txBuyToken = await buyToken(tokenAddress, routerAddress, wtrxAddress, buyerKeys[i])
                bundle_txs.push(txBuyToken)
            } catch (error) {
                console.log(`buy transaction failed: ${error}`)
                return false
            }
        }

        // // Call setMode 0
        try {
            const txSetMode0 = await setMode(0, tokenAddress, ownerKey)
            bundle_txs.push(txSetMode0)
        } catch (error) {
            console.log(`set mode failed: ${error}`)
            return false
        }

        const txIds = await send_raw_bundle(bundle_txs)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(txIds);
            }, 1000);
        })
    } catch (error) {
        console.error('Error calling smart contract:', error);
    }
}

export async function sellToken(tokenAddress, routerAddress, WTRXAddress, privateKey) {
    tronWeb.setPrivateKey(privateKey)
    const pubKey = tronWeb.address.fromPrivateKey(privateKey);
    console.log(pubKey)
    const tokenAmount = await getTokenBalance(tokenAddress, pubKey)
    console.log(tokenAmount)

    const DEADLINEBUY = Math.floor(Date.now() / 1000) + 60 * 20;
    // Parameters
    const parametersSwap = [
        { type: 'uint256', value: tokenAmount }, // token amount
        { type: 'uint256', value: 0 }, // min trx amount
        { type: 'address[]', value: [tokenAddress, WTRXAddress] }, // path
        { type: 'address', value: routerAddress }, // router address
        { type: 'uint256', value: DEADLINEBUY }, // deadline
    ];

    // Options
    const optionsSwap = {
        feeLimit: 5000000000, // Example fee limit in SUN
        callValue: 0, // Example call value, in this case, 0 TRX
        tokenValue: 0 // No token being transferred
    };
    try {
        let resultSwap;
        try {
            resultSwap = await tronWeb.transactionBuilder.triggerSmartContract(
                routerAddress,
                'swapExactTokensForETH(uint256, uint256, address[], address, uint256)', // Function selector
                optionsSwap,
                parametersSwap,
                pubKey
            );
        } catch (error) {
            console.error('Error sellToken(build transaction):', error);
            return error;
        }

        // Sign the transaction
        try {
            const signedTransactionSwap = await tronWeb.trx.sign(resultSwap.transaction, privateKey);
            await tronWeb.trx.sendRawTransaction(signedTransactionSwap)
            return signedTransactionSwap;
        } catch (error) {
            console.error('Error buyToken(sign transaction):', error);
            return error;
        }
    } catch (error) {
        console.error('Error buyToken:', error);
        return error;
    }
}