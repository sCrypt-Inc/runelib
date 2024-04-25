# RuneLib
[runelib](https://www.npmjs.com/package/runelib) is a TypeScript library for Runes on Bitcoin. It enciphers and deciphers [Rune protocol messages](https://docs.ordinals.com/runes/specification.html#runestones) called "runestones", which are used to mint and etch Rune tokens.

It works in both node.js and browsers.

## Installation
``` bash
npm install runelib
```


# Decipher/Decode


```ts
const mintRawTx = '02000000000101dc58870c48618a937cda4ea238587e17413dde50f8fb8de0e87144acea817bbb0100000000fdffffff030000000000000000086a5d0514d301140110270000000000002251207817a206d8fc43fe54a61a94dd4ff01ec7286826cf44526a59265bf9d3909c66f39b052a01000000225120675fad4019ca08cdc3cf8678af6faa6686b719389a930b0fa13c4ecf9ea7d08b0140f775e5e75ac8ed4d1556779525da619851a95d8328a78382c1c719cf28c76eaf550551643b9e92feba132f75595992d34babe1193ecfad03eb5d830b42da10c100000000'

const stone = Runestone.decipher(mintRawTx);
```


# Encipher/Encode

```ts
const block = 2586233;
const txIndex = 1009;
const mintstone = new Runestone([], none(), some(new RuneId(block, txIndex)), some(1));

const buffer = mintstone.encipher();
```


# Mint

The following example code mints [UNCOMMON•GOODS](https://ordinals.com/rune/UNCOMMON%E2%80%A2GOODS).

```ts

async function mint() {
    const mintstone = new Runestone([], none(), some(new RuneId(1, 0)), some(1));

    const keyPair = ECPair.fromWIF(
        yourKey,
        network
    );

    const { address, } = payments.p2wpkh({ pubkey: keyPair.publicKey, network })

    console.log('address:', address)

    const utxos = await waitUntilUTXO(address as string)
    console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

    const psbt = new Psbt({ network });
    psbt.addInput({
        hash: utxos[0].txid,
        index: utxos[0].vout,
        witnessUtxo: { value: utxos[0].value, script: Address.toOutputScript(address as string, network) },
    });

    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0
    });

    psbt.addOutput({
        address: ord_address, // ord address
        value: 10000
    });

    const fee = 5000;

    const change = utxos[0].value - fee - 10000;

    psbt.addOutput({
        address: change_address, // change address
        value: change
    });

    await signAndSend(keyPair, psbt, address as string);
}
```

# Etch

The following example code etches a new token.

```ts


async function etching() {
    const name = "CCCCCCCCCCCCCCCCCCNH";

    const keyPair = ECPair.fromWIF(
        your_key,
        network
    );

    const ins = new EtchInscription()

    ins.setContent("text/plain", Buffer.from('scrypt is best', 'utf-8'))
    ins.setRune(name)

    const etching_script_asm = `${toXOnly(keyPair.publicKey).toString(
        "hex"
    )} OP_CHECKSIG`;
    const etching_script = Buffer.concat([script.fromASM(etching_script_asm), ins.encipher()]);

    const scriptTree: Taptree = {
        output: etching_script,
    }

    const script_p2tr = payments.p2tr({
        internalPubkey: toXOnly(keyPair.publicKey),
        scriptTree,
        network,
    });

    const etching_redeem = {
        output: etching_script,
        redeemVersion: 192
    }


    const etching_p2tr = payments.p2tr({
        internalPubkey: toXOnly(keyPair.publicKey),
        scriptTree,
        redeem: etching_redeem,
        network
    });


    const address = script_p2tr.address ?? "";
    console.log("send coin to address", address);

    const utxos = await waitUntilUTXO(address as string)
    console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

    const psbt = new Psbt({ network });


    psbt.addInput({
        hash: utxos[0].txid,
        index: utxos[0].vout,
        witnessUtxo: { value: utxos[0].value, script: script_p2tr.output! },
        tapLeafScript: [
            {
                leafVersion: etching_redeem.redeemVersion,
                script: etching_redeem.output,
                controlBlock: etching_p2tr.witness![etching_p2tr.witness!.length - 1]
            }
        ]
    });

    const rune = Rune.fromName(name)

    const amount = 1000;
    const cap = 21000;
    const terms = new Terms(amount, cap, new Range(none(), none()), new Range(none(), none()))
    const symbol = "$"
    const premine = none();
    const divisibility = none();
    const etching = new Etching(divisibility, premine, some(rune), none(), some(symbol), some(terms), true);

    const stone = new Runestone([], some(etching), none(), none());

    psbt.addOutput({
        script: stone.encipher(),
        value: 0
    })


    const fee = 5000;

    const change = utxos[0].value - 546 - fee;

    psbt.addOutput({
        address: ord_address, // ord address
        value: 546
    });

    psbt.addOutput({
        address: change_address, // change address
        value: change
    });

    await signAndSend(keyPair, psbt, address as string);
}
```

---

## Contributing

All contributions are welcome. Feel free to open PRs.
