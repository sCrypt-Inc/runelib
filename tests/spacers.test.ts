import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { applySpacers, getSpacersVal } from '../src/utils'
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
    
    // TODO: test invalid values

})
