import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { applySpacers, getSpacersVal } from '../src/spacers'
import { Rune } from '../dist'
use(chaiAsPromised)

describe('Test rune name spacers', () => {

    it('should correctly apply spacers to rune name', async () => {
        expect(applySpacers('AAAA', 0)).to.equal('AAAA')
        expect(applySpacers('AAAA', 1)).to.equal('A•AAA')
        expect(applySpacers('AAAA', 2)).to.equal('AA•AA')
        expect(applySpacers('AAAA', 3)).to.equal('A•A•AA')
        expect(applySpacers('AAAA', 7)).to.equal('A•A•A•A')
    })

    it('should correctly get spacers value', async () => {
        expect(getSpacersVal('AAAA')).to.equal(0)
        expect(getSpacersVal('A•AAA')).to.equal(1)
        expect(getSpacersVal('AA•AA')).to.equal(2)
        expect(getSpacersVal('A•A•AA')).to.equal(3)
        expect(getSpacersVal('A•A•A•A')).to.equal(7)
    })



    it('should correctly encode and decode name', async () => {

        function doEncodeAndDecode(name: string) : string {
            const name_ = new Rune(Rune.fromName(name).value).name

            return applySpacers(name_, getSpacersVal(name))
        }
        
        const name1 = 'XXXXXX';

        expect(doEncodeAndDecode(name1)).to.equal(name1)

        const name2 = 'AAA•DD•D•FF•FSS•SD•DS';

        expect(doEncodeAndDecode(name2)).to.equal(name2)

        const name3 = 'YOU•ARE•SO•PRETTY';

        expect(doEncodeAndDecode(name3)).to.equal(name3)

        const name4 = 'ZZZZ•ZZZZ•ZZZZ•ZZZZ•TEST•TTTT';

        expect(doEncodeAndDecode(name4)).to.equal(name4)

        const name5 = 'RUNE•MEA•BSK•GARF';

        expect(doEncodeAndDecode(name5)).to.equal(name5)
    })
})
