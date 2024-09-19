import {TronWeb} from 'tronweb';
import { sleep } from 'tronweb/utils';
import { FULL_NODE, NILE_FULL_NODE } from './tronConst.js';

export let tronWeb;

export function setTronWeb(networkMode) {
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
}

export async function send_raw_bundle(raw_bundle_tx) {
    if (raw_bundle_tx.length == 0) {
        console.log(`no transaction`)
    }
    let txIds = [];
    const len = raw_bundle_tx.length;
    for (let i = 0; i < len; i++) {
        try {
            console.log(`bundle transaction: ${raw_bundle_tx[i].txID}`)
            const transaction = await tronWeb.trx.sendRawTransaction(raw_bundle_tx[i]);
            txIds.push(transaction.txid);   
        } catch (error) {
            console.log("transaction failed: ", error);
        }             
    }
    let maxRetries = 10
    while (maxRetries > 0) {
        try {
            await tronWeb.trx.getConfirmedTransaction(txIds[len-1])
            console.log(`send transaction successful!`)
            break
        } catch (error) {
        }
        sleep(1000)
        maxRetries--
    }
    return txIds
}

export async function send_bundle(bundle_tx) {
    let txIds = [];
    const len = bundle_tx.length;
    for (let i = 0; i < len; i++) {
        let signedTransaction;
        try {
            signedTransaction = await tronWeb.trx.sign(bundle_tx[i].transaction, bundle_tx[i].privateKey);
        } catch (error) {
            console.error('Error setMode(sign transaction):', error);
            return error;
        }
        try {
            const transaction = await tronWeb.trx.sendRawTransaction(signedTransaction);
            txIds.push(transaction.txid);   
        } catch (error) {
            console.log("transaction failed: ", error);
        }             
    }
    return txIds
}
