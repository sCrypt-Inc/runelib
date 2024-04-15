import { Option, none, some } from "./fts";

import { Transaction, script,  } from "bitcoinjs-lib";
import { Varint } from "./varint";
import { base26Decode, base26Encode } from "./utils";

export class RuneId {
    constructor(public block: number, public id: number) {

    }
}


export class Edict {
    constructor(public id: RuneId, public amount: number, public output: number) {

    }
}

export enum Flag {
    Etching = 0,
    Terms = 1,
    Turbo = 2,
    Cenotaph = 127,
}

export enum Tag {
    Body = 0,
    Flags = 2,
    Rune = 4,
    Premine = 6,
    Cap = 8,
    Amount = 10,
    HeightStart = 12,
    HeightEnd = 14,
    OffsetStart = 16,
    OffsetEnd = 18,
    Mint = 20,
    Pointer = 22,
    Cenotaph = 126,

    Divisibility = 1,
    Spacers = 3,
    Symbol = 5,
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
    
  
    public static fromName(s: string): Rune {
      return new Rune(base26Encode(s));
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

export class Runestone {
    // 
    static  readonly MAGIC_NUMBER: number = 93;
    constructor(
        public edicts: Array<Edict> = [],
        public etching: Option<Etching>,
        public mint: Option<RuneId>,
        public pointer: Option<number>) {
    }


    static decipher(rawTx: string): Option<Runestone> {
        const tx = Transaction.fromHex(rawTx);

        const payload = Runestone.payload(tx);

        if(payload.isSome()) {
            const integers = Runestone.integers(payload.value() as number[]);


            const message = Message.from_integers(tx, integers.value() as bigint[]);

            const etching = message.takeEtching();

            const mint = message.takeMint();
            const pointer = message.takePointer();

            return some(new Runestone(message.edicts, etching, mint, pointer));

        }


        return none();

    }

    static encipher(): number[] {
        throw new Error("TODO")
    }


    static payload(tx: Transaction): Option<number[]> {

        for (const output of tx.outs) {
            //script.fromASM
            const ls = script.decompile(output.script) as Array<number | Uint8Array>;

            if(ls[0] !== script.OPS.OP_RETURN) {
                continue;
            }


            if(ls[1] !== Runestone.MAGIC_NUMBER) {
                continue;
            }

            for (let i = 2; i < ls.length; i++) {
                const element = ls[i];

                if(element instanceof Uint8Array) {
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
    
        while( i < payload.length) {
          let {
            n, 
            len
          } = Varint.decode(payload.slice(i));
          integers.push(n);
          i += len;
        }
    
        return some(integers)
      }

}




export class Message {

    constructor(
        public fields: Map<number, Array<bigint>>,
        public edicts: Array<Edict>,
        public flaws: number,
    ) {

    }

    static from_integers(tx: Transaction, payload: bigint[]): Message {

        let edicts: Array<Edict> = [];
        let fields: Map<number, bigint[]> = new Map();
        let flaws = 0;


        for (let i = 0; i < payload.length; ) {
            let tag = payload[i];

            let val = payload[i + 1];

            const vals = fields.get(Number(tag)) || [];

            vals.push(val);

            fields.set(Number(tag), vals);

            i += 2;
            
        }

        return new Message(fields, edicts, flaws);

    }


    takeFlags() : number {
        return Number(this.fields.get(Tag.Flags));
    }

    hasFlags(flag: Flag) : boolean {

        const flags = this.takeFlags();

        const mask = 1 << flag;

        return (flags & mask) != 0
    }

    takeMint() : Option<RuneId> {
        if(!this.fields.has(Tag.Mint)) {
            return none();
        }

        const [block, tx] = this.fields.get(Tag.Mint) as [bigint, bigint];

        return some(new RuneId(Number(block), Number(tx)));
    }

    takeEtching() : Option<Etching> {
        if(!this.hasFlags(Flag.Etching)) {
            return none();
        }

        const divisibility = this.takeDivisibility();

        const premine = this.takePremine();

        const rune = this.takeRune();
        const spacers = this.takeSpacers();
        const symbol = this.takeSymbol();
        const terms = this.takeTerms();
        const turbo = this.hasFlags(Flag.Turbo);


        return some(new Etching(divisibility, premine, rune, spacers, symbol, terms, turbo));

    }

    takeDivisibility() : Option<number> {
        if(!this.fields.has(Tag.Divisibility)) {
            return none();
        }
        const [divisibility] = this.fields.get(Tag.Divisibility) as [bigint];

        if(divisibility > Etching.MAX_DIVISIBILITY) {
            throw new Error("invalid divisibility");
        }
        
        return some(Number(divisibility));
    }

    takePremine() : Option<number> {
        if(!this.fields.has(Tag.Premine)) {
            return none();
        }
        const [premine] = this.fields.get(Tag.Premine) as [bigint];
        
        return some(Number(premine));
    }

    takeRune() : Option<Rune> {
        if(!this.fields.has(Tag.Rune)) {
            return none();
        }
        const [rune] = this.fields.get(Tag.Rune) as [bigint];
        
        return some(new Rune(rune));
    }

    takeSpacers() : Option<number> {
        if(!this.fields.has(Tag.Spacers)) {
            return none();
        }
        const [spacers] = this.fields.get(Tag.Spacers) as [bigint];
        if(spacers > Etching.MAX_SPACERS) {
            throw new Error("invalid spacers");
        }
        return some(Number(spacers));
    }

    
    takeHeightStart() : Option<number> {
        if(!this.fields.has(Tag.HeightStart)) {
            return none();
        }
        const [heightStart] = this.fields.get(Tag.HeightStart) as [bigint];

        return some(Number(heightStart));
    }

    takeHeightEnd() : Option<number> {
        if(!this.fields.has(Tag.HeightEnd)) {
            return none();
        }
        const [heightEnd] = this.fields.get(Tag.HeightEnd) as [bigint];

        return some(Number(heightEnd));
    }

    takeOffsetStart() : Option<number> {
        if(!this.fields.has(Tag.OffsetStart)) {
            return none();
        }
        const [offsetStart] = this.fields.get(Tag.OffsetStart) as [bigint];

        return some(Number(offsetStart));
    }

    takeOffsetEnd() : Option<number> {
        if(!this.fields.has(Tag.OffsetEnd)) {
            return none();
        }
        const [offsetEnd] = this.fields.get(Tag.OffsetEnd) as [bigint];

        return some(Number(offsetEnd));
    }

    takeCap() : Option<number> {
        if(!this.fields.has(Tag.Cap)) {
            return none();
        }
        const [cap] = this.fields.get(Tag.Cap) as [bigint];

        return some(Number(cap));
    }

    takeAmount() : Option<number> {
        if(!this.fields.has(Tag.Amount)) {
            return none();
        }
        const [amount] = this.fields.get(Tag.Amount) as [bigint];

        return some(Number(amount));
    }


    takeSymbol() : Option<string> {
        if(!this.fields.has(Tag.Symbol)) {
            return none();
        }
        const [symbol] = this.fields.get(Tag.Symbol) as [bigint];

        return some(String.fromCharCode(Number(symbol)));
    }


    takeTerms() : Option<Terms> {
        if(!this.hasFlags(Flag.Terms)) {
            return none();
        }

        const cap = this.takeCap();

        if(!cap.isSome()) {
            throw new Error("no cap field")
        }

        const amount = this.takeAmount();

        if(!amount.isSome()) {
            throw new Error("no amount field")
        }

        const heightStart = this.takeHeightStart();
        const heightEnd = this.takeHeightEnd();

        const offsetStart = this.takeOffsetStart();
        const offsetEnd = this.takeOffsetEnd();

        const height = new Range(heightStart, heightEnd);

        const offset = new Range(offsetStart, offsetEnd);

    
        return some(new Terms(amount.value() as number, cap.value() as number, height, offset));
    }



    takePointer() : Option<number> {
        if(!this.fields.has(Tag.Pointer)) {
            return none();
        }

        const [pointer] = this.fields.get(Tag.Pointer) as [bigint];
        
        return some(Number(pointer));
    }

  }