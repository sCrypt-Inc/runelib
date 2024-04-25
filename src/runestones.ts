import { Transaction, script } from "bitcoinjs-lib";
import { base26Decode, base26Encode } from "./base26";
import { Option, none, some } from "./fts";
import { decodeLEB128, encodeLEB128 } from "./leb128";
import { chunks, toPushData } from "./utils";
import { getSpacersVal, removeSpacers } from "./spacers";


/**
 * Rune IDs are represented in text as BLOCK:TX.
 */
export class RuneId {
    constructor(public block: number, public idx: number) {

    }

    next(block: bigint, idx: bigint): Option<RuneId> {

        if (block > BigInt(Number.MAX_SAFE_INTEGER)) {
            return none();
        }

        if (idx > BigInt(Number.MAX_SAFE_INTEGER)) {
            return none();
        }

        let b = BigInt(this.block) + block;

        if (b > BigInt(Number.MAX_SAFE_INTEGER)) {
            return none();
        }


        let i = block === 0n ? BigInt(this.idx) + idx : idx;

        if (i > BigInt(Number.MAX_SAFE_INTEGER)) {
            return none();
        }


        return some(new RuneId(Number(b), Number(i)))
    }
}


/**
 * Rune ID block heights and transaction indices in edicts are delta encoded.
 * Edict rune ID decoding starts with a base block height and transaction index of zero. 
 * When decoding each rune ID, first the encoded block height delta is added to the base block height. 
 * If the block height delta is zero, the next integer is a transaction index delta. 
 * If the block height delta is greater than zero, the next integer is instead an absolute transaction index.
 */
export class Edict {
    constructor(public id: RuneId, public amount: bigint, public output: number) {

    }

    static from_integers(tx: Transaction, id: RuneId, amount: bigint, output: bigint): Option<Edict> {

        if (output > 4_294_967_295n || output < 0n) {
            return none();
        }

        if (Number(output) > tx.outs.length) {
            return none();
        }

        return some(new Edict(id, amount, Number(output)))

    }
}


export enum Flag {
    /** The Etching flag marks this transaction as containing an etching. */
    Etching = 0,
    /** The Terms flag marks this transaction's etching as having open mint terms. */
    Terms = 1,
    /** The Turbo flag marks this transaction's etching as opting into future protocol changes. These protocol changes may increase light client validation costs, or just be highly degenerate. */
    Turbo = 2,
    /** The Cenotaph flag is unrecognized. */
    Cenotaph = 127,
}

export enum Tag {
    /** The Body tag marks the end of the runestone's fields, causing all following integers to be interpreted as edicts. */
    Body = 0,
    /** The Flag field contains a bitmap of flags, whose position is 1 << FLAG_VALUE: */
    Flags = 2,
    /** The Rune field contains the name of the rune being etched. If the Etching flag is set but the Rune field is omitted, a reserved rune name is allocated. */
    Rune = 4,
    /** The Premine field contains the amount of premined runes. */
    Premine = 6,
    /** The Cap field contains the allowed number of mints. */
    Cap = 8,
    /** The Amount field contains the amount of runes each mint transaction receives. */
    Amount = 10,
    /** The HeightStart and HeightEnd fields contain the mint's starting and ending absolute block heights, respectively. The mint is open starting in the block with height HeightStart, and closes in the block with height HeightEnd. */
    HeightStart = 12,
    HeightEnd = 14,
    /** The OffsetStart and OffsetEnd fields contain the mint's starting and ending block heights, relative to the block in which the etching is mined. The mint is open starting in the block with height OffsetStart + ETCHING_HEIGHT, and closes in the block with height OffsetEnd + ETCHING_HEIGHT. */
    OffsetStart = 16,
    OffsetEnd = 18,
    /** The Mint field contains the Rune ID of the rune to be minted in this transaction. */
    Mint = 20,
    /** The Pointer field contains the index of the output to which runes unallocated by edicts should be transferred. If the Pointer field is absent, unallocated runes are transferred to the first non-OP_RETURN output. */
    Pointer = 22,
    /** The Cenotaph field is unrecognized. */
    Cenotaph = 126,

    /** The Divisibility field, raised to the power of ten, is the number of subunits in a super unit of runes. */
    Divisibility = 1,

    /** The Spacers field is a bitfield of • spacers that should be displayed between the letters of the rune's name. Trailing spacers are ignored. */
    Spacers = 3,
    /** The Symbol field is the Unicode codepoint of the Rune's currency symbol, 
     * which should be displayed after amounts of that rune. If a rune does not have a currency symbol,
     * the generic currency character ¤ should be used. 
     * For example, if the Symbol is # and the divisibility is 2, 
     * the amount of 1234 units should be displayed as 12.34 #. 
     */
    Symbol = 5,
    /** The Nop field is unrecognized. */
    Nop = 127,
}



export enum Flaw {
    EdictOutput,
    EdictRuneId,
    InvalidScript,
    Opcode,
    SupplyOverflow,
    TrailingIntegers,
    TruncatedField,
    UnrecognizedEvenTag,
    UnrecognizedFlag,
    Varint,
}

export class Range {
    constructor(public start: Option<number>, public end: Option<number>) {

    }
}


export class Terms {
    constructor(public amount: number, public cap: number, public height: Range, public offset: Range) {

    }
}


export class Rune {

    constructor(public value: bigint) {

    }

    public get name(): string {
        return Rune.toName(this.value)
    }

    public static toName(s: bigint): string {
        return base26Decode(s);
    }

    public static fromName(name: string): Rune {
        return new Rune(base26Encode(removeSpacers(name)));
    }

    toString() {
        return this.name;
    }

}


export class Etching {

    static readonly MAX_DIVISIBILITY: number = 38;
    static readonly MAX_SPACERS: number = 0b00000111_11111111_11111111_11111111;

    constructor(
        public divisibility: Option<number>,
        public premine: Option<number>,
        public rune: Option<Rune>,
        public spacers: Option<number>,
        public symbol: Option<string>,
        public terms: Option<Terms>,
        public turbo: boolean) {

    }

}


export interface EtchJSON {
    name: string;
    divisibility?: number;
    premine?: number;
    symbol?: string;
    amount: number;
    cap: number;
    startHeight?: number;
    endHeight?: number;
    startOffset?: number;
    endOffset?: number;

    pointer?: number;
}

export interface MintJSON {
    block: number;
    txIdx: number;
    pointer?: number;
}


export class Runestone {

    static readonly MAGIC_NUMBER: number = 93;
    constructor(
        public edicts: Array<Edict> = [],
        public etching: Option<Etching>,
        public mint: Option<RuneId>,
        public pointer: Option<number>
    ) {
    }

    static create(json: EtchJSON | MintJSON, type: 'etch' | 'mint' | 'transfer' = 'etch') {

        if (type === 'etch') {
            json = json as EtchJSON
            const runename = Rune.fromName(json.name);

            const terms = new Terms(
                json.amount,
                json.cap,
                new Range(
                    json.startHeight ? some(json.startHeight) : none(),
                    json.endHeight ? some(json.endHeight) : none()
                ),
                new Range(
                    json.startOffset ? some(json.startOffset) : none(),
                    json.endOffset ? some(json.endOffset) : none()
                )
            );

            const divisibility = json.divisibility ? some(json.divisibility) : none();

            const premine = json.premine ? some(json.premine) : none();

            const spacers = json.name.indexOf('•') > -1 ? some(getSpacersVal(json.name)) : none();

            const symbol = json.symbol ? some(json.symbol) : none();


            const pointer = typeof json.pointer === 'number' ? some(json.pointer) : none();


            const etching = new Etching(
                divisibility,
                premine,
                some(runename),
                spacers,
                symbol,
                some(terms),
                true
            );

            return new Runestone([], some(etching), none(), pointer);
        } else if (type === 'mint') {
            json = json as MintJSON
            const pointer = typeof json.pointer === 'number' ? some(json.pointer) : none();

            return new Runestone([], none(), some(new RuneId(json.block, json.txIdx)), pointer);
        } else {
            throw new Error(`not ${type} support now`)
        }
    }

    static decipher(rawTx: string): Option<Runestone> {
        const tx = Transaction.fromHex(rawTx);

        const payload = Runestone.payload(tx);

        if (payload.isSome()) {
            const integers = Runestone.integers(payload.value() as number[]);

            const message = Message.from_integers(tx, integers.value() as bigint[]);

            const etching = message.getEtching();

            const mint = message.getMint();
            const pointer = message.getPointer();

            return some(new Runestone(message.edicts, etching, mint, pointer));

        }

        return none();
    }


    encipher(): Buffer {
        const msg = this.toMessage()
        const msgBuff = msg.toBuffer()

        const prefix = Buffer.from('6a5d', 'hex')  // OP_RETURN OP_13
        const pushNum = Buffer.alloc(1)
        pushNum.writeUint8(msgBuff.length)
        return Buffer.concat([prefix, pushNum, msgBuff])
    }


    static payload(tx: Transaction): Option<number[]> {

        for (const output of tx.outs) {
            //script.fromASM
            const ls = script.decompile(output.script) as Array<number | Uint8Array>;

            if (ls[0] !== script.OPS.OP_RETURN) {
                continue;
            }


            if (ls[1] !== Runestone.MAGIC_NUMBER) {
                continue;
            }

            for (let i = 2; i < ls.length; i++) {
                const element = ls[i];

                if (element instanceof Uint8Array) {
                    return some(Array.from(element))
                }
                return none();
            }


            return none();

        }

        return none();
    }


    static integers(payload: number[]): Option<bigint[]> {
        let integers: bigint[] = [];
        let i = 0;

        while (i < payload.length) {
            let {
                n,
                len
            } = decodeLEB128(payload.slice(i));
            integers.push(n);
            i += len;
        }

        return some(integers)
    }


    toMessage(): Message {

        let fields: Map<number, bigint[]> = new Map();

        const etching = this.etching.value();

        if (etching) {

            let flags = 1;

            if (etching.terms.isSome()) {
                let mask = 1 << Flag.Terms;
                flags |= mask
            }


            if (etching.turbo) {
                let mask = 1 << Flag.Turbo;
                flags |= mask
            }

            fields.set(Tag.Flags, [BigInt(flags)])


            const rune = etching.rune.value()

            if (rune !== null) {
                fields.set(Tag.Rune, [BigInt(rune.value)])
            }

            const divisibility = etching.divisibility.value()

            if (divisibility !== null) {
                fields.set(Tag.Divisibility, [BigInt(divisibility)])
            }

            const spacers = etching.spacers.value()

            if (spacers !== null) {
                fields.set(Tag.Spacers, [BigInt(spacers)])
            }

            const symbol = etching.symbol.value()

            if (symbol !== null) {
                fields.set(Tag.Symbol, [BigInt(symbol.charCodeAt(0))])
            }

            const premine = etching.premine.value()

            if (premine !== null) {
                fields.set(Tag.Premine, [BigInt(premine)])
            }

            const terms = etching.terms.value()

            if (terms !== null) {
                fields.set(Tag.Amount, [BigInt(terms.amount)])
                fields.set(Tag.Cap, [BigInt(terms.cap)])


                const heightStart = terms.height.start.value();

                if (heightStart) {
                    fields.set(Tag.HeightStart, [BigInt(heightStart)])

                }


                const heightEnd = terms.height.end.value();

                if (heightEnd) {
                    fields.set(Tag.HeightEnd, [BigInt(heightEnd)])
                }

                const offsetStart = terms.offset.start.value();

                if (offsetStart) {
                    fields.set(Tag.OffsetStart, [BigInt(offsetStart)])

                }

                const offsetEnd = terms.offset.end.value();

                if (offsetEnd) {
                    fields.set(Tag.OffsetEnd, [BigInt(offsetEnd)])
                }
            }
        }


        const mint = this.mint.value();

        if (mint !== null) {
            fields.set(Tag.Mint, [BigInt(mint.block), BigInt(mint.idx)])
        }

        const pointer = this.pointer.value();

        if (pointer !== null) {
            fields.set(Tag.Pointer, [BigInt(pointer)])
        }

        return new Message(fields, this.edicts, 0);

    }

}




export class Message {

    constructor(
        public fields: Map<number, Array<bigint>> = new Map(),
        public edicts: Array<Edict> = [],
        public flaws: number = 0,
    ) {

    }

    static from_integers(tx: Transaction, integers: bigint[]): Message {
        let fields: Map<number, bigint[]> = new Map();
        let edicts: Array<Edict> = [];
        let flaws = 0;

        let isBody = false

        for (let i = 0; i < integers.length;) {
            let tag = integers[i];
            if (Number(tag) === Tag.Body) {
                isBody = true
                i += 1
                continue
            }

            if (!isBody) {
                // Fields:
                let val = integers[i + 1];
                const vals = fields.get(Number(tag)) || [];
                vals.push(val);

                fields.set(Number(tag), vals);

                i += 2;
            } else {
                // Edicts:
                let id = new RuneId(0, 0);

                for (const chunk of chunks(integers.slice(i), 4)) {
                    if (chunk.length != 4) {
                        flaws |= Flaw.TrailingIntegers;
                        break;
                    }

                    let next = id.next(chunk[0], chunk[1]);

                    if (!next.isSome()) {
                        flaws |= Flaw.EdictRuneId;
                        break;
                    }

                    const edict = Edict.from_integers(tx, next.value()!, chunk[2], chunk[3]);

                    if (!edict.isSome()) {
                        flaws |= Flaw.EdictOutput;
                        break;
                    }

                    id = next.value() as RuneId;
                    edicts.push(edict.value() as Edict);
                }

                i += 4;
            }
        }

        return new Message(fields, edicts, flaws);
    }

    addFieldVal(tag: number, val: bigint) {
        const vals = this.fields.get(Number(tag)) || [];
        vals.push(val);

        this.fields.set(Number(tag), vals);
    }

    addEdict(edict: Edict) {
        this.edicts.push(edict)
    }

    toBuffer(): Buffer {
        const buffArr: Buffer[] = []

        // Serialize fields.
        for (const [tag, vals] of this.fields) {
            for (const val of vals) {
                const tagBuff = Buffer.alloc(1)
                tagBuff.writeUInt8(tag)
                buffArr.push(tagBuff)

                buffArr.push(Buffer.from(encodeLEB128(val)))
            }
        }

        // Serialize edicts.
        if (this.edicts.length > 0) {
            buffArr.push(Buffer.from('00', 'hex'))
            // 1) Sort by block height
            // 2) Sort by tx idx
            this.edicts.sort((a, b) => {
                if (a.id.block == b.id.block) {
                    return a.id.idx - b.id.idx
                }
                return a.id.block - b.id.block
            })
            // 3) Delta encode
            let lastBlockHeight: bigint = 0n;
            let lastTxIdx: bigint = 0n;
            for (let i = 0; i < this.edicts.length; i++) {
                const edict = this.edicts[i]
                if (i == 0) {
                    lastBlockHeight = BigInt(edict.id.block)
                    lastTxIdx = BigInt(edict.id.idx)
                    buffArr.push(Buffer.from(encodeLEB128(lastBlockHeight)))
                    buffArr.push(Buffer.from(encodeLEB128(lastTxIdx)))
                } else {
                    const currBlockHeight = BigInt(edict.id.block)
                    const currTxIdx = BigInt(edict.id.idx)

                    if (currBlockHeight == lastBlockHeight) {
                        const deltaTxIdx = currTxIdx - lastTxIdx
                        lastTxIdx = currTxIdx

                        buffArr.push(Buffer.from(encodeLEB128(0n)))
                        buffArr.push(Buffer.from(encodeLEB128(deltaTxIdx)))
                    } else {
                        const deltaBlockHeight = currBlockHeight - lastBlockHeight
                        lastBlockHeight = currBlockHeight
                        lastTxIdx = currTxIdx

                        buffArr.push(Buffer.from(encodeLEB128(deltaBlockHeight)))
                        buffArr.push(Buffer.from(encodeLEB128(currTxIdx)))
                    }
                }

                buffArr.push(Buffer.from(encodeLEB128(BigInt(edict.amount))))
                buffArr.push(Buffer.from(encodeLEB128(BigInt(edict.output))))
            }
        }

        return Buffer.concat(buffArr)
    }

    getFlags(): number {
        return Number(this.fields.get(Tag.Flags));
    }

    hasFlags(flag: Flag): boolean {

        const flags = this.getFlags();

        const mask = 1 << flag;

        return (flags & mask) != 0
    }

    getMint(): Option<RuneId> {
        if (!this.fields.has(Tag.Mint)) {
            return none();
        }

        const [block, tx] = this.fields.get(Tag.Mint) as [bigint, bigint];

        return some(new RuneId(Number(block), Number(tx)));
    }

    getEtching(): Option<Etching> {
        if (!this.hasFlags(Flag.Etching)) {
            return none();
        }

        const divisibility = this.getDivisibility();

        const premine = this.getPremine();

        const rune = this.getRune();
        const spacers = this.getSpacers();
        const symbol = this.getSymbol();
        const terms = this.getTerms();
        const turbo = this.hasFlags(Flag.Turbo);


        return some(new Etching(divisibility, premine, rune, spacers, symbol, terms, turbo));

    }

    getDivisibility(): Option<number> {
        if (!this.fields.has(Tag.Divisibility)) {
            return none();
        }
        const [divisibility] = this.fields.get(Tag.Divisibility) as [bigint];

        if (divisibility > Etching.MAX_DIVISIBILITY) {
            throw new Error("invalid divisibility");
        }

        return some(Number(divisibility));
    }

    getPremine(): Option<number> {
        if (!this.fields.has(Tag.Premine)) {
            return none();
        }
        const [premine] = this.fields.get(Tag.Premine) as [bigint];

        return some(Number(premine));
    }

    getRune(): Option<Rune> {
        if (!this.fields.has(Tag.Rune)) {
            return none();
        }
        const [rune] = this.fields.get(Tag.Rune) as [bigint];

        return some(new Rune(rune));
    }

    getSpacers(): Option<number> {
        if (!this.fields.has(Tag.Spacers)) {
            return none();
        }
        const [spacers] = this.fields.get(Tag.Spacers) as [bigint];
        if (spacers > Etching.MAX_SPACERS) {
            throw new Error("invalid spacers");
        }
        return some(Number(spacers));
    }


    getHeightStart(): Option<number> {
        if (!this.fields.has(Tag.HeightStart)) {
            return none();
        }
        const [heightStart] = this.fields.get(Tag.HeightStart) as [bigint];

        return some(Number(heightStart));
    }

    getHeightEnd(): Option<number> {
        if (!this.fields.has(Tag.HeightEnd)) {
            return none();
        }
        const [heightEnd] = this.fields.get(Tag.HeightEnd) as [bigint];

        return some(Number(heightEnd));
    }

    getOffsetStart(): Option<number> {
        if (!this.fields.has(Tag.OffsetStart)) {
            return none();
        }
        const [offsetStart] = this.fields.get(Tag.OffsetStart) as [bigint];

        return some(Number(offsetStart));
    }

    getOffsetEnd(): Option<number> {
        if (!this.fields.has(Tag.OffsetEnd)) {
            return none();
        }
        const [offsetEnd] = this.fields.get(Tag.OffsetEnd) as [bigint];

        return some(Number(offsetEnd));
    }

    getCap(): Option<number> {
        if (!this.fields.has(Tag.Cap)) {
            return none();
        }
        const [cap] = this.fields.get(Tag.Cap) as [bigint];

        return some(Number(cap));
    }

    getAmount(): Option<number> {
        if (!this.fields.has(Tag.Amount)) {
            return none();
        }
        const [amount] = this.fields.get(Tag.Amount) as [bigint];

        return some(Number(amount));
    }


    getSymbol(): Option<string> {
        if (!this.fields.has(Tag.Symbol)) {
            return none();
        }
        const [symbol] = this.fields.get(Tag.Symbol) as [bigint];

        return some(String.fromCharCode(Number(symbol)));
    }


    getTerms(): Option<Terms> {
        if (!this.hasFlags(Flag.Terms)) {
            return none();
        }

        const cap = this.getCap();

        if (!cap.isSome()) {
            throw new Error("no cap field")
        }

        const amount = this.getAmount();

        if (!amount.isSome()) {
            throw new Error("no amount field")
        }

        const heightStart = this.getHeightStart();
        const heightEnd = this.getHeightEnd();

        const offsetStart = this.getOffsetStart();
        const offsetEnd = this.getOffsetEnd();

        const height = new Range(heightStart, heightEnd);

        const offset = new Range(offsetStart, offsetEnd);


        return some(new Terms(amount.value() as number, cap.value() as number, height, offset));
    }



    getPointer(): Option<number> {
        if (!this.fields.has(Tag.Pointer)) {
            return none();
        }

        const [pointer] = this.fields.get(Tag.Pointer) as [bigint];

        return some(Number(pointer));
    }

}


export class EtchInscription {

    static Tag = {
        CONTENT_TYPE: 1,
        POINTER: 2,
        PARENT: 3,
        METADATA: 5,
        METAPROTOCOL: 7,
        CONTENT_ENCODING: 9,
        DELEGATE: 11,
        RUNE: 13
    }

    constructor(
        public fields: Map<number, Buffer> = new Map(),
        public data: Buffer = Buffer.alloc(0)
    ) {

    }

    setContent(contentType: string, data: Buffer) {
        this.fields.set(1, Buffer.from(contentType, 'utf8'))
        this.data = data
    }

    setRune(rune: string) {
        const n = base26Encode(removeSpacers(rune));
        let nstr = n.toString(16);

        if (nstr.length % 2 === 1) {
            nstr = '0' + nstr;
        }

        this.setField(EtchInscription.Tag.RUNE, Buffer.from(nstr, 'hex').reverse());
    }

    setField(field: number, val: Buffer) {
        this.fields.set(field, val)
    }

    static decipher(
        rawTx: string,
        inputIdx: number
    ) {
        const tx = Transaction.fromHex(rawTx);

        const witness = tx.ins[inputIdx].witness
        const tapscript = witness[1]

        const ls = script.decompile(tapscript) as Array<number | Uint8Array>;

        const fields: Map<number, Buffer> = new Map()
        const dataChunks: Array<Buffer> = []

        let isData = false
        for (let i = 5; i < ls.length - 1;) {
            const chunk = ls[i]

            if (chunk === 0) {
                isData = true
                i++
                continue
            } else if (isData) {
                // Data
                dataChunks.push(chunk as Buffer)
                i++
            } else {
                // Fields
                const tag = (chunk as number) - 80
                const val = ls[i + 1]
                if (typeof val == 'number') {
                    const buff = Buffer.alloc(1)
                    buff.writeUint8(val)
                    fields.set(tag, buff)
                } else {
                    fields.set(tag, val as Buffer)
                }
                i += 2
            }

        }

        return new EtchInscription(
            fields,
            Buffer.concat(dataChunks)
        )
    }

    encipher(): Buffer {
        const res = [
            Buffer.from('0063036f7264', 'hex') // 0 OP_IF "ord"
        ]

        Array.from(this.fields.entries())
            .sort((a, b) => a[0] - b[0]) // Sorting by tag in ascending order
            .forEach(([tag, val]) => {
                const tagBuff = Buffer.alloc(1);
                tagBuff.writeUInt8(tag);
                res.push(Buffer.from('01', 'hex'))
                res.push(tagBuff);

                if (val.length != 1 || val[0] != 0x00) {
                    res.push(toPushData(val))
                } else {
                    res.push(val);
                }
            });

        if (this.data && this.data.length > 0) {

            res.push(Buffer.from('00', 'hex'))

            const dataChunks = chunks(Array.from(this.data), 520)
            for (const chunk of dataChunks) {
                res.push(toPushData(Buffer.from(chunk)))
            }
        }

        res.push(Buffer.from('68', 'hex')) // OP_ENDIF

        return Buffer.concat(res)
    }

}

