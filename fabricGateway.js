const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function connectToGateway() {
    // Load connection profile
    const ccpPath = path.resolve(__dirname, 'path', 'to', 'connection.json'); // Update with your connection.json path
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Load wallet
    const walletPath = path.join(process.cwd(), 'wallet'); // Update with your wallet path
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'YourIdentity', discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork('YourChannelName');

    // Get the contract from the network
    const contract = network.getContract('YourContractName');

    return {
        async submitTransaction(...args) {
            const result = await contract.submitTransaction(...args);
            console.log(`Transaction has been submitted, result is: ${result.toString()}`);
            return result;
        }
    };
}

exports.FabricGateway = FabricGateway;
exports.connectToGateway = connectToGateway;
