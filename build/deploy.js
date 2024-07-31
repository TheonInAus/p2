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
/// @title Deploy and interact with MyToken contract
/// @author Dilum Bandara, CSIRO's Data61
const solc_lib_1 = require("./solc-lib");
const { Web3, ETH_DATA_FORMAT, DEFAULT_RETURN_FORMAT } = require('web3');
const util_1 = require("./util");
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
    if (cmdArgs[0] == 'deploy') {
        const accountName = cmdArgs[1]; //manager
        const contractName = cmdArgs[2]; //name of .sol
        try {
            getAccount(web3, accountName);
        }
        catch (error) {
            console.error(error);
            throw 'Cannot access accounts';
        }
        console.log('Accessing account: ' + accountName);
        const from = web3.eth.accounts.wallet[0].address;
        // Compile contract and save it into a file for future use
        let compiledContract;
        try {
            compiledContract = (0, solc_lib_1.compileSols)([contractName]);
            (0, solc_lib_1.writeOutput)(compiledContract, buildPath);
        }
        catch (error) {
            console.error(error);
            throw 'Error while compiling contract';
        }
        console.log('Contract compiled');
        // Deploy contract
        const contract = new web3.eth.Contract(compiledContract.contracts[contractName][contractName].abi);
        const data = compiledContract.contracts[contractName][contractName].evm.bytecode.object;
        // Deploy contract with given constructor arguments
        try {
            const contractSend = contract.deploy({
                data
            });
            // Get current average gas price
            const gasPrice = yield web3.eth.getGasPrice(ETH_DATA_FORMAT);
            const gasLimit = yield contractSend.estimateGas({ from }, DEFAULT_RETURN_FORMAT);
            console.log("gas price:", `${gasPrice}`);
            console.log("gas: ", util_1.GasHelper.gasPay(gasLimit));
            const tx = yield contractSend.send({
                from,
                gasPrice,
                gas: util_1.GasHelper.gasPay(gasLimit)
            });
            console.log('Contract contract deployed at address: ' + tx.options.address);
        }
        catch (error) {
            console.error(error);
            throw 'Error while deploying contract';
        }
    }
    else if (cmdArgs[0] == 'addFarmer') {
        const contractName = cmdArgs[1];
        const contractAddress = cmdArgs[2];
        const farmer = cmdArgs[3];
        const abi = getABI(contractName, buildPath);
        const contract = new web3.eth.Contract(abi, contractAddress);
        try {
            getAccount(web3, "manager");
        }
        catch (error) {
            console.error(error);
            throw 'Cannot access accounts';
        }
        const from = web3.eth.accounts.wallet[0].address;
        // add farmer
        try {
            yield contract.methods.addFarmer(farmer).call({ from: from });
            console.log(`add farmer: ${farmer}`);
        }
        catch (error) {
            console.error('Error can not add farmer');
            console.error(error);
        }
    }
    else if (cmdArgs[0] == 'addTransporter') {
        const contractName = cmdArgs[1];
        const contractAddress = cmdArgs[2];
        const transporter = cmdArgs[3];
        const abi = getABI(contractName, buildPath);
        const contract = new web3.eth.Contract(abi, contractAddress);
        try {
            getAccount(web3, "manager");
        }
        catch (error) {
            console.error(error);
            throw 'Cannot access accounts';
        }
        const from = web3.eth.accounts.wallet[0].address;
        // add transporter
        try {
            const symbol = yield contract.methods.addFarmer(transporter).call({ from: from });
            console.log(`add transporter: ${transporter}`);
        }
        catch (error) {
            console.error('Error can not add transporter');
            console.error(error);
        }
    }
    else if (cmdArgs[0] == 'addInspector') {
        const contractName = cmdArgs[1];
        const contractAddress = cmdArgs[2];
        const inspector = cmdArgs[3];
        const abi = getABI(contractName, buildPath);
        const contract = new web3.eth.Contract(abi, contractAddress);
        try {
            getAccount(web3, "manager");
        }
        catch (error) {
            console.error(error);
            throw 'Cannot access accounts';
        }
        const from = web3.eth.accounts.wallet[0].address;
        // add inspector
        try {
            const symbol = yield contract.methods.addFarmer(inspector).call({ from: from });
            console.log(`add inspector: ${inspector}`);
        }
        catch (error) {
            console.error('Error can not add inspector');
            console.error(error);
        }
    }
    else if (cmdArgs[0] == 'addRetailer') {
        const contractName = cmdArgs[1];
        const contractAddress = cmdArgs[2];
        const retailer = cmdArgs[3];
        const abi = getABI(contractName, buildPath);
        const contract = new web3.eth.Contract(abi, contractAddress);
        try {
            getAccount(web3, "manager");
        }
        catch (error) {
            console.error(error);
            throw 'Cannot access accounts';
        }
        const from = web3.eth.accounts.wallet[0].address;
        try {
            const symbol = yield contract.methods.addFarmer(retailer).call({ from: from });
            console.log(`add retailer: ${retailer}`);
        }
        catch (error) {
            console.error('Error can not add retailer');
            console.error(error);
        }
    }
    process.exitCode = 0;
}))();
