import ethers from 'ethers';
import { encodeActCall, encodeCallScript } from '../helpers/dao.mjs';
import { rpc, private_key, token,  acl, voting, aggregator } from './.config.mjs';
import pkg from 'web3-utils';
const { keccak256 } = pkg;


const run = async () => {
    // 0. setup ethers: **This Wallet must have signed the agreement and be
    //    staked in the DAO else the transaction will fail
    const provider = ethers.getDefaultProvider(rpc)
    const signer = new ethers.Wallet(private_key, provider);

    // 1. encode ACL call data
    const aclCallData = await encodeActCall(
        'createPermission(address,address,bytes32,address)', [
            voting,
            aggregator,
            keccak256('ADD_POWER_SOURCE_ROLE'),
            voting,
        ]
    ) 

    // 2. encode votingAggregator call data
    const aggregatorCallData = await encodeActCall(
        'addPowerSource(address,uint8,uint256)', [
            token,
            1, // ERC20WithCheckpointing
            1
        ]
    )
     
    // 3. create call script
    const callscript = encodeCallScript([
        {
            to: acl,
            calldata: aclCallData
        },
        {
            to: aggregator,
            calldata: aggregatorCallData
        }
    ])

    // 4. create the voting contract we want to interact with
    const votingApp = new ethers.Contract(
        voting,
        ["function newVote(bytes,bytes) external"],
        signer
    )

    // 5. create transaction
    // not sure what the context here is so i just copied from tests
    await votingApp.newVote(callscript, '0xabcdef');
    console.log('done!')
}

run()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1)
    })
