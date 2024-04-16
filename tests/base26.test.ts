import { base26Encode } from '../src/base26'

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
    })
})
