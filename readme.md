## Addresses

```
0x6880f6Fd960D1581C2730a451A22EED1081cfD72 <- main fuel contract
```

## Tokens setup

```
DAI: 1
USDC: 2
USDT: 3
```

## Storage

```
BOND_SIZE=0.5 eth
operator=0xfA990ea3Cc8F1Ec066986477eDF457FfbAd6e39c
SUBMISSION_DELAY=33230
```

## Past events:

```
Found  13
event TokenIndexed(address indexed token, uint256 indexed id)  =>  0x0000000000000000000000000000000000000000, 0
event AddressIndexed(address indexed owner, uint256 indexed id)  =>  0x0000000000000000000000000000000000000000, 0
event BlockCommitted(address producer, uint256 numTokens, uint256 numAddresses, bytes32 indexed previousBlockHash, uint256 indexed height, bytes32[] roots)  =>  0xfA990ea3Cc8F1Ec066986477eDF457FfbAd6e39c, 1, 1, 0x0000000000000000000000000000000000000000000000000000000000000000, 0
event TokenIndexed(address indexed token, uint256 indexed id)  =>  0x6B175474E89094C44Da98b954EedeAC495271d0F, 1
event DepositMade(address indexed owner, uint32 indexed token, uint256 value)  =>  0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C, 1, 200000000000000000
event TokenIndexed(address indexed token, uint256 indexed id)  =>  0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, 2
event DepositMade(address indexed owner, uint32 indexed token, uint256 value)  =>  0xD2a8dD8F9F4371b636BFE8dd036772957a5D425C, 2, 1000000
skipped
event RootCommitted(bytes32 indexed root, address rootProducer, uint256 feeToken, uint256 fee, uint256 rootLength, bytes32 indexed merkleTreeRoot, bytes32 indexed commitmentHash)  =>  0x35b22a65e7f73b37184948f963d55818a84cb716949906617e1bb326eb8307af, 0x0EA6b5edC8905C85514B3676703f1Bfe6ec260aD, 4, 6190576000000000, 221, 0x280436b436343060a061eb855fbb73614ae6405217e653edd63fdc734dbb8bf7, 0x717c0e45ddc43c31726036e590c5e8ffe49cbdda1051c5b19c0577aba0c105f0
event BlockCommitted(address producer, uint256 numTokens, uint256 numAddresses, bytes32 indexed previousBlockHash, uint256 indexed height, bytes32[] roots)  =>  0xfA990ea3Cc8F1Ec066986477eDF457FfbAd6e39c, 5, 1, 0xe2f5af691f19a3e21dda0b7439527fe51255e1e90e16a3eb12891447ff934c1d, 6
event WithdrawalMade(address indexed owner, address tokenAddress, uint256 amount, uint32 indexed blockHeight, uint32 rootIndex, bytes32 indexed transactionLeafHash, uint8 outputIndex, uint32 transactionIndex)  =>  0xfA990ea3Cc8F1Ec066986477eDF457FfbAd6e39c, 0x0000000000000000000000000000000000000000, 500000000000000000, 5, 0, 0x0000000000000000000000000000000000000000000000000000000000000000, 0, 0
event WithdrawalMade(address indexed owner, address tokenAddress, uint256 amount, uint32 indexed blockHeight, uint32 rootIndex, bytes32 indexed transactionLeafHash, uint8 outputIndex, uint32 transactionIndex)  =>  0xfA990ea3Cc8F1Ec066986477eDF457FfbAd6e39c, 0x0000000000000000000000000000000000000000, 500000000000000000, 6, 0, 0x0000000000000000000000000000000000000000000000000000000000000000, 0, 0
event RootCommitted(bytes32 indexed root, address rootProducer, uint256 feeToken, uint256 fee, uint256 rootLength, bytes32 indexed merkleTreeRoot, bytes32 indexed commitmentHash)  =>  0x00d06a0a76ae847cbe85f647538c2e827a043c5da583b7200d28ecf658a2925b, 0x0EA6b5edC8905C85514B3676703f1Bfe6ec260aD, 2, 2705, 141, 0x64c233187ed31522a3e468d89b0290aad79c027f4ddfd54a4357d85ac3c24ae7, 0xb52d968bb47b27e8a9c76b71c2adeb18f7dfee659a4a9a55082a3304f75e1824

```

## Decoding YULP style reverts

1. Get tx to mine anyway (provide gasLimit).
2. Get its trace:

```
curl -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0", "id": 1, "method": "debug_traceTransaction", "params": [ "0x0a0a1d5c917bbd50f24eb98a57610005c4a13ece4487edf31a678e7d5f2259ba" ] }' http://localhost:8545 > trace.json
```

3. Error id will be at the top of dumped memory during REVERT opcode.
4. Read exact error message string using mapping in `fuel.json`.

Pointers:

- error description: https://github.com/FuelLabs/yulp#error-reporting
- revert impl: https://github.com/FuelLabs/yulp/commit/092e5b90e8f7945f6b7634396d71fb31c48c0afe
