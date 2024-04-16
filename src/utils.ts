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
