"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ipfs_http_client_1 = require("ipfs-http-client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Initialize IPFS client
const ipfs = (0, ipfs_http_client_1.create)({ url: 'https://ipfs.infura.io:5001/api/v0' });
function uploadFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read the file
            const file = fs_1.default.readFileSync(filePath);
            // Upload the file to IPFS
            const { cid } = yield ipfs.add(file);
            // Return the CID
            return cid.toString();
        }
        catch (error) {
            console.error('Error uploading file to IPFS:', error);
            throw error;
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.join(__dirname, 'example.txt'); // Replace with your file path
    const cid = yield uploadFile(filePath);
    console.log('File CID:', cid);
}))();
