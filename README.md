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
        value: 546
    });

    const fee = 5000;

    const change = utxos[0].value - fee - 546;

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

    // you need to wait the funding transaction get `6` or more confirmations

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



# Transfer

You can transfer runes by edicts.
```ts

const keyPair = ECPair.fromWIF(
    yourKey,
    network
);


const tweakedSigner = tweakSigner(keyPair, { network });
// Generate an address from the tweaked public key
const p2pktr = payments.p2tr({
    pubkey: toXOnly(tweakedSigner.publicKey),
    network
});
const address = p2pktr.address ?? "";
console.log(`Waiting till UTXO is detected at this Address: ${address}`);

const utxos = await waitUntilUTXO(address as string);


const psbt = new Psbt({ network });

for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];

    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: { value: utxo.value, script: p2pktr.output! },
        tapInternalKey: toXOnly(keyPair.publicKey)
    });

}

const edicts: Array<Edict> = [];
// transfer BESTSCRYPTMINT on testnet
const edict: Edict = new Edict(new RuneId(2586233, 1009), 100n, 1 /**receiving runes at 1th output**/)
edicts.push(edict)

const mintstone = new Runestone(edicts, none(), none(), some(2) /**receiving change runes at 2th output**/);


psbt.addOutput({
    script: mintstone.encipher(),
    value: 0
});


psbt.addOutput({
    address:  change_ord_address, // receiver ord address
    value: 546
});


psbt.addOutput({
    address:  receiver_ord_address, // change ord address
    value: 546
});


const fee = 6000;

const change = utxos.reduce((acc, utxo) => {
    return acc + utxo.value
}, 0) - fee - 546*2;

psbt.addOutput({
    address: change_address, // change address
    value: change
});

await signAndSend(tweakedSigner, psbt, address as string);
```




# Airdrop

Airdrop runes by transfering runes.


```ts

const keyPair = ECPair.fromWIF(
    YourKey,
    network
);


const tweakedSigner = tweakSigner(keyPair, { network });
// Generate an address from the tweaked public key
const p2pktr = payments.p2tr({
    pubkey: toXOnly(tweakedSigner.publicKey),
    network
});
const address = p2pktr.address ?? "";
console.log(`Waiting till UTXO is detected at this Address: ${address}`);

const utxos = await waitUntilUTXO(address as string);

console.log(`Using UTXO len: ${utxos.length}`);


const psbt = new Psbt({ network });

for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];

    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: { value: utxo.value, script: p2pktr.output! },
        tapInternalKey: toXOnly(keyPair.publicKey)
    });

    
}

const edicts: Array<Edict> = [];

for (let i = 0; i < 10; i++) {
    const edict: Edict = new Edict(new RuneId(2586233, 1009), 100n, i+2)
    edicts.push(edict)
}

const mintstone = new Runestone(edicts, none(), none(), none());


psbt.addOutput({
    script: mintstone.encipher(),
    value: 0
});

psbt.addOutput({
    address: change_ord_address, // rune change address
    value: 546
});

for (let i = 0; i < 10; i++) {
    psbt.addOutput({
        address: receiver_ord_address, // rune receive address
        value: 546
    });
}



const fee = 100000;

const change = utxos.reduce((acc, utxo) => {
    return acc + utxo.value
}, 0) - fee - 546*11;

psbt.addOutput({
    address: change_address, // change address
    value: change
});

await signAndSend(tweakedSigner, psbt, address as string);
```




---

# Contributing

All contributions are welcome. Feel free to open PRs.
