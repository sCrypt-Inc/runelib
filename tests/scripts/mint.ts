import {
    Transaction,
    script,
    Psbt,
    address as Address,
    initEccLib,
    networks,
    Signer as BTCSigner,
    crypto,
    payments,
} from "bitcoinjs-lib";
import { ECPairFactory, ECPairAPI } from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
import axios, { AxiosResponse } from "axios";
import { Rune, RuneId, Runestone, EtchInscription, none, some, Terms, Range, Etching } from "../../dist";


initEccLib(ecc as any);
declare const window: any;
const ECPair: ECPairAPI = ECPairFactory(ecc);
const network = networks.testnet;

// mint: http://bridge.scrypt.io:8888/rune/BESTSCRYPTMINT


async function mintWithP2wpkh() {

    const mintstone = new Runestone([], none(), some(new RuneId(2586233, 1009)), some(1));



    const keyPair = ECPair.fromWIF(
        "cPwrst1ya98KhMRc5Bbj3MPB9AjQWvMAxjxQDWzv2Ak2Bq4EoXYP",
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
        address: "tb1qh9338ymus4tcsv7g0xptwx4ksjsujqmlq945cp", // rune receive address
        value: 10000
    });

    const fee = 5000;

    const change = utxos[0].value - fee - 10000;

    psbt.addOutput({
        address: "tb1qh9338ymus4tcsv7g0xptwx4ksjsujqmlq945cp", // change address
        value: change
    });


    await signAndSend(keyPair, psbt, address as string);
    


}


async function mintWithTaproot() {

    const mintstone = new Runestone([], none(), some(new RuneId(2586233, 1009)), some(1));



    const keyPair = ECPair.fromWIF(
        "cPwrst1ya98KhMRc5Bbj3MPB9AjQWvMAxjxQDWzv2Ak2Bq4EoXYP",
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



    const utxos = await waitUntilUTXO(address as string)
    console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);



    const psbt = new Psbt({ network });
    psbt.addInput({
        hash: utxos[0].txid,
        index: utxos[0].vout,
        witnessUtxo: { value: utxos[0].value, script: p2pktr.output! },
        tapInternalKey: toXOnly(keyPair.publicKey)
    });

    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0
    });

    psbt.addOutput({
        address: "tb1qh9338ymus4tcsv7g0xptwx4ksjsujqmlq945cp", // rune receive address
        value: 10000
    });

    const fee = 5000;

    const change = utxos[0].value - fee - 10000;

    psbt.addOutput({
        address: "tb1qh9338ymus4tcsv7g0xptwx4ksjsujqmlq945cp", // change address
        value: change
    });



    await signAndSend(tweakedSigner, psbt, address as string);

}





async function mintWithP2pkh() {

    const mintstone = new Runestone([], none(), some(new RuneId(2586233, 1009)), some(1));

    const keyPair = ECPair.fromWIF(
        "cPwrst1ya98KhMRc5Bbj3MPB9AjQWvMAxjxQDWzv2Ak2Bq4EoXYP",
        network
    );

    const { address, } = payments.p2pkh({ pubkey: keyPair.publicKey, network })

    console.log('address:', address)

    const utxos = await waitUntilUTXO(address as string)
    console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);


    const rawTx = await getTx(utxos[0].txid);


    const psbt = new Psbt({ network });
    psbt.addInput({
        hash: utxos[0].txid,
        index: utxos[0].vout,
        nonWitnessUtxo: Buffer.from(rawTx, 'hex')
    });

    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0
    });

    psbt.addOutput({
        address: "tb1qh9338ymus4tcsv7g0xptwx4ksjsujqmlq945cp", // rune receive address
        value: 10000
    });

    const fee = 5000;
    const change = utxos[0].value - fee - 10000;

    psbt.addOutput({
        address: "tb1qh9338ymus4tcsv7g0xptwx4ksjsujqmlq945cp", // change address
        value: change
    });

    await signAndSend(keyPair, psbt, address as string);


}


// main
mintWithTaproot();



const blockstream = new axios.Axios({
    baseURL: `https://blockstream.info/testnet/api`
});

export async function waitUntilUTXO(address: string) {
    return new Promise<IUTXO[]>((resolve, reject) => {
        let intervalId: any;
        const checkForUtxo = async () => {
            try {
                const response: AxiosResponse<string> = await blockstream.get(`/address/${address}/utxo`);
                const data: IUTXO[] = response.data ? JSON.parse(response.data) : undefined;
                console.log(data);
                if (data.length > 0) {
                    resolve(data);
                    clearInterval(intervalId);
                }
            } catch (error) {
                reject(error);
                clearInterval(intervalId);
            }
        };
        intervalId = setInterval(checkForUtxo, 10000);
    });
}

export async function getTx(id: string): Promise<string> {
    const response: AxiosResponse<string> = await blockstream.get(`/tx/${id}/hex`);
    return response.data;
}


export async function signAndSend(keyPair: BTCSigner, psbt: Psbt, address: string) {
    if (process.env.NODE) {

        psbt.signInput(0, keyPair);
        psbt.finalizeAllInputs();

        const tx = psbt.extractTransaction();
        console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
        const txid = await broadcast(tx.toHex());
        console.log(`Success! Txid is ${txid}`);


    } else { // in browser

        try {
            let res = await window.unisat.signPsbt(psbt.toHex(), {
                toSignInputs: [
                    {
                        index: 0,
                        address: address,
                    }
                ]
            });

            console.log("signed psbt", res)

            res = await window.unisat.pushPsbt(res);

            console.log("txid", res)
        } catch (e) {
            console.log(e);
        }
    }

}


export async function broadcast(txHex: string) {
    const response: AxiosResponse<string> = await blockstream.post('/tx', txHex);
    return response.data;
}


function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
    return crypto.taggedHash(
        "TapTweak",
        Buffer.concat(h ? [pubKey, h] : [pubKey])
    );
}

function toXOnly(pubkey: Buffer): Buffer {
    return pubkey.subarray(1, 33);
}

function tweakSigner(signer: BTCSigner, opts: any = {}): BTCSigner {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey: Uint8Array | undefined = signer.privateKey!;
    if (!privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc.privateNegate(privateKey);
    }

    const tweakedPrivateKey = ecc.privateAdd(
        privateKey,
        tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash)
    );
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }

    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network,
    });
}


interface IUTXO {
    txid: string;
    vout: number;
    status: {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    };
    value: number;
}