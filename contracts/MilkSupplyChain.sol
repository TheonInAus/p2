// SPDX-License-Identifier: MIT
pragma solidity >=0.5.8 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MilkSupplyAccessControl is AccessControl {
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant TRANSPORTER_ROLE = keccak256("TRANSPORTER_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addFarmer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(FARMER_ROLE, account);
    }

    function addTransporter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(TRANSPORTER_ROLE, account);
    }

    function addInspector(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(INSPECTOR_ROLE, account);
    }

    function addRetailer(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, account);
    }
}

contract MilkSupplyChain is MilkSupplyAccessControl {
    struct BatchInfo {
        uint256 productionDate;
        uint256 weight;
        uint256 expiryDate;
    }

    struct TransportInfo {
        address transporter;
        string status;
        string reportCID;
    }

    struct InspectionInfo {
        address inspector;
        string status;
        string reportCID;
    }

    struct ReceivingInfo {
        address retailer;
        string status;
        string reportCID;
    }

    struct MilkBatch {
        BatchInfo batchInfo;
        TransportInfo transportInfo;
        InspectionInfo inspectionInfo;
        ReceivingInfo receivingInfo;
        address currentOwner;
    }

    uint256 private batchCounter;
    mapping(uint256 => MilkBatch) public milkBatches;
    mapping(address => uint256[]) private myBatches;

    event BatchCreated(uint256 indexed batchId, address indexed farmer, uint256 productionDate, uint256 weight, uint256 expiryDate, address transporter);
    event TransportStatusUpdated(uint256 batchId, string status, string reportCID, address newOwner);
    event InspectionStatusUpdated(uint256 batchId, string status, string reportCID, address newOwner);
    event ReceivingStatusUpdated(uint256 batchId, string status, string reportCID);
    event OwnershipTransferred(uint256 batchId, address previousOwner, address newOwner);

    constructor() MilkSupplyAccessControl() {
        batchCounter = 0;
    }

    function createBatch(uint256 _weight, uint256 _expiryDate, address _transporter) public onlyRole(FARMER_ROLE) returns (uint256) {
        batchCounter++;
        MilkBatch storage newBatch = milkBatches[batchCounter];
        
        newBatch.batchInfo = BatchInfo({
            productionDate: block.timestamp,
            weight: _weight,
            expiryDate: _expiryDate
        });
        
        newBatch.transportInfo.status = "Not Started";
        newBatch.inspectionInfo.status = "Not Inspected";
        newBatch.receivingInfo.status = "Not Received";
        newBatch.currentOwner = msg.sender;
        
        myBatches[msg.sender].push(batchCounter);
        
        emit BatchCreated(batchCounter, msg.sender, block.timestamp, _weight, _expiryDate, _transporter);
        
        if (_transporter != address(0)) {
            transferOwnership(batchCounter, _transporter);
        }
        
        return batchCounter;
    }

    function updateTransportStatus(uint256 _batchId, string memory _status, string memory _reportCID, address _processor) public onlyRole(TRANSPORTER_ROLE) {
        require(milkBatches[_batchId].currentOwner == msg.sender, "Only current owner can update");
        TransportInfo storage transport = milkBatches[_batchId].transportInfo;
        transport.status = _status;
        transport.reportCID = _reportCID;
        transport.transporter = msg.sender;
        
        address newOwner = _processor != address(0) ? _processor : milkBatches[_batchId].currentOwner;
        emit TransportStatusUpdated(_batchId, _status, _reportCID, newOwner);
        
        if (_processor != address(0)) {
            transferOwnership(_batchId, _processor);
        }
    }

    function updateInspectionStatus(uint256 _batchId, string memory _status, string memory _reportCID, address _retailer) public onlyRole(INSPECTOR_ROLE) {
        InspectionInfo storage inspection = milkBatches[_batchId].inspectionInfo;
        inspection.status = _status;
        inspection.reportCID = _reportCID;
        inspection.inspector = msg.sender;
        
        address newOwner = _retailer != address(0) ? _retailer : milkBatches[_batchId].currentOwner;
        emit InspectionStatusUpdated(_batchId, _status, _reportCID, newOwner);
        
        if (_retailer != address(0)) {
            transferOwnership(_batchId, _retailer);
        }
    }

    function updateReceivingStatus(uint256 _batchId, string memory _status, string memory _reportCID) public onlyRole(RETAILER_ROLE) {
        require(milkBatches[_batchId].currentOwner == msg.sender, "Only current owner can update");
        ReceivingInfo storage receiving = milkBatches[_batchId].receivingInfo;
        receiving.status = _status;
        receiving.reportCID = _reportCID;
        receiving.retailer = msg.sender;
        emit ReceivingStatusUpdated(_batchId, _status, _reportCID);
    }

    function transferOwnership(uint256 _batchId, address _newOwner) public {
        require(milkBatches[_batchId].currentOwner == msg.sender, "Only current owner can transfer");
        address previousOwner = milkBatches[_batchId].currentOwner;
        milkBatches[_batchId].currentOwner = _newOwner;

        // Remove the batch from the previous owner's list
        uint256[] storage previousOwnerBatches = myBatches[previousOwner];
        for (uint256 i = 0; i < previousOwnerBatches.length; i++) {
            if (previousOwnerBatches[i] == _batchId) {
                previousOwnerBatches[i] = previousOwnerBatches[previousOwnerBatches.length - 1];
                previousOwnerBatches.pop();
                break;
            }
        }

        // Add the batch to the new owner's list
        myBatches[_newOwner].push(_batchId);

        emit OwnershipTransferred(_batchId, previousOwner, _newOwner);
    }

    function getBatchInfo(uint256 _batchId) public view returns (MilkBatch memory) {
        return milkBatches[_batchId];
    }

    function getPublicBatchInfo(uint256 _batchId) public view returns (uint256, uint256, uint256, string memory) {
        MilkBatch storage batch = milkBatches[_batchId];
        return (
            _batchId,
            batch.batchInfo.productionDate,
            batch.batchInfo.expiryDate,
            batch.inspectionInfo.reportCID
        );
    }

    function getMyBatches() public view returns (uint256[] memory) {
        return myBatches[msg.sender];
    }

    function getLatestBatchId() public view returns (uint256) {
        return batchCounter;
    }
}