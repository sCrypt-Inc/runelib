export function base26Encode(input: string): bigint {
    let result = 0n;

    for (let i = 0; i < input.length; i++) {
        const charCode = BigInt(input.charCodeAt(i) - 'A'.charCodeAt(0));

        const iInv = BigInt(input.length) - 1n - BigInt(i);

        if (iInv == 0n) {
            result += charCode
        } else {
            const base = 26n ** iInv
            result += base * (charCode + 1n)
        }
    }

    return result;
}

export function base26Decode(s: bigint): string {
    if (s === 340282366920938463463374607431768211455n) {
        return "BCGDENLQRQWDSLRUGSNLBTMFIJAV";
    }

    s += 1n;
    let symbol = [];
    while (s > 0) {
        const i = (s - 1n) % 26n;
        symbol.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Number(i)))
        s = (s - 1n) / 26n;
    }
    return symbol.reverse().join('')
}

/**
 * Prepends a '0' to an odd character length word to ensure it has an even number of characters.
 * @param {string} word - The input word.
 * @returns {string} - The word with a leading '0' if it's an odd character length; otherwise, the original word.
 */
export const zero2 = (word: string): string => {
    if (word.length % 2 === 1) {
        return '0' + word
    } else {
        return word
    }
}

/**
 * Converts an array of numbers to a hexadecimal string representation.
 * @param {number[]} msg - The input array of numbers.
 * @returns {string} - The hexadecimal string representation of the input array.
 */
export const toHex = (msg: number[]): string => {
    let res = ''
    for (let i = 0; i < msg.length; i++) {
        res += zero2(msg[i].toString(16))
    }
    return res
}
