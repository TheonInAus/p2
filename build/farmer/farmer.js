"use strict";
/// SPDX-License-Identifier: UNLICENSED
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Web3, ETH_DATA_FORMAT, DEFAULT_RETURN_FORMAT } = require('web3');
let fs = require('fs');
const path = require('path');
/**
 * Init WebSocket provider
 * @return {Web3BaseProvider} Provider
 */
const initProvider = () => {
    try {
        const providerData = fs.readFileSync('eth_providers/providers.json', 'utf8');
        const providerJson = JSON.parse(providerData);
        //Enable one of the next 2 lines depending on Ganache CLI or GUI
        // const providerLink = providerJson['provider_link_ui']
        const providerLink = providerJson['provider_link_cli'];
        return new Web3.providers.WebsocketProvider(providerLink);
    }
    catch (error) {
        throw 'Cannot read provider';
    }
};
/**
 * Get an account given its name
 * @param {typeof Web3} Web3 Web3 provider
 * @param {string} name Account name
 */
const getAccount = (web3, manager) => {
    try {
        const accountData = fs.readFileSync('eth_accounts/accounts.json', 'utf8');
        const accountJson = JSON.parse(accountData);
        const accountPvtKey = accountJson[manager]['pvtKey'];
        // Build an account object given private key
        web3.eth.accounts.wallet.add(accountPvtKey);
    }
    catch (error) {
        throw 'Cannot read account';
    }
};
/**
 * Get a ABI of given contract
 * @param {string} contractName Contract name
 * @param {string} buildPath Path of the build folder
 * @return {AbiStruct} ABI
 */
const getABI = (contractName, buildPath) => {
    try {
        const filePath = path.resolve(buildPath, contractName + '.json');
        const contractData = fs.readFileSync(filePath, 'utf8');
        const contractJson = JSON.parse(contractData);
        return contractJson[contractName][contractName].abi;
    }
    catch (error) {
        throw 'Cannot read account';
    }
};
// Get command line arguments
const cmdArgs = process.argv.slice(2);
if (cmdArgs.length < 1) {
    console.error("node programName cmd, e.g. node build/index.js deploy");
    process.exitCode = 1;
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    let web3Provider;
    let web3;
    const buildPath = path.resolve(__dirname, '');
    // Init Web3 provider
    try {
        web3Provider = initProvider();
        web3 = new Web3(web3Provider);
    }
    catch (error) {
        console.error(error);
        throw 'Web3 cannot be initialised.';
    }
    console.log('Connected to Web3 provider.');
    if (cmdArgs[0] == 'createBatch') {
        const accountName = cmdArgs[1]; //farmer
        const contractName = cmdArgs[2]; //name of .sol
        const contractAddress = cmdArgs[3];
        const weight = parseInt(cmdArgs[4]);
        const expireDate = parseInt(cmdArgs[5]);
        const transporter = cmdArgs[6];
        const abi = getABI(contractName, buildPath);
        const contract = new web3.eth.Contract(abi, contractAddress);
        try {
            getAccount(web3, "farmer");
        }
        catch (error) {
            console.error(error);
            throw 'Cannot access accounts';
        }
        const from = web3.eth.accounts.wallet[0].address;
        try {
            const counter = yield contract.methods.createBatch(weight, expireDate, transporter).call({ from: from });
            console.log(`counter: ${counter}`);
        }
        catch (error) {
            console.error('Error can not create milk batch');
            console.error(error);
        }
    }
    process.exitCode = 0;
}))();
