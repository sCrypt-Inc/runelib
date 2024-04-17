import { base26Decode, base26Encode } from '../src/base26'

import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test Base64', () => {
    it('should correctly encode', async () => {
        expect(base26Encode('B')).to.equal(1n)
        expect(base26Encode('AA')).to.equal(26n)
        expect(base26Encode('BA')).to.equal(52n)
        expect(base26Encode('AAAAAAAAAAAAAAAAAAAAAAAAAAA')).to.equal(
            6402364363415443603228541259936211926n
        )
        expect(base26Encode('TTTTTTTTTTTTTTTTTTTT')).to.equal(
            15942519116167527321872157899n
        )
    })

    it('should correctly decode', async () => {
        expect(base26Decode(1n)).to.equal('B')
        expect(base26Decode(26n)).to.equal('AA')
        expect(base26Decode(52n)).to.equal('BA')
        expect(base26Decode(6402364363415443603228541259936211926n)).to.equal('AAAAAAAAAAAAAAAAAAAAAAAAAAA')
        expect(base26Decode(15942519116167527321872157899n)).to.equal('TTTTTTTTTTTTTTTTTTTT')
    })
})
