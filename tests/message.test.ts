
import { Edict, Message, Rune, RuneId, Tag } from '../src/runestones'

import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test Message', () => {
    it('should correctly encode etch reveal msg', async () => {
        const msg = new Message()

        msg.addFieldVal(Tag.Flags, 3n)        // flags value == 0011, etching + terms
        msg.addFieldVal(Tag.Rune, Rune.fromName('BESTSCRYPTMINT').value)
        msg.addFieldVal(Tag.Divisibility, 2n)
        msg.addFieldVal(Tag.Symbol, 0x53n)    // "S"
        msg.addFieldVal(Tag.Amount, 100000n)  // 1000.00 (since divisibility is 2)
        msg.addFieldVal(Tag.Cap, 10000n)

        const expected = Buffer.from('020304cbfed481d8d9bdbf4c010205530aa08d0608904e', 'hex')
        const actual = msg.toBuffer()
        expect(actual).to.eql(expected)
    })

    it('should correctly encode mint msg', async () => {
        const msg = new Message()

        msg.addFieldVal(Tag.Mint, 211n)  // Block #211
        msg.addFieldVal(Tag.Mint, 1n)    // Tx #1

        const expected = Buffer.from('14d3011401', 'hex')
        const actual = msg.toBuffer()
        expect(actual).to.eql(expected)
    })

    it('should correctly encode transfer msg', async () => {
        const msg = new Message()

        msg.addEdict(
            new Edict(
                new RuneId(
                    211, 1   // Block #211, Tx #1
                ),
                25000n,
                2
            )
        )

        const expected = Buffer.from('00d30101a8c30102', 'hex')
        const actual = msg.toBuffer()
        expect(actual).to.eql(expected)
    })

    it('should correctly encode transfer msg (multiple edicts)', async () => {
        // TODO
    })
})
