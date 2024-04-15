export class Varint {

    static encode(n: number): number[] {
        return []
    }


    static decode(buf: number[]): {
        n: bigint,
        len: number
    } {


        let n = BigInt(0);
        for (let i = 0; i < buf.length; i++) {
            const byte = BigInt(buf[i]);

            if (i > 18) {
                throw new Error("Overlong");
              }
            
              let value = byte & BigInt(0b0111_1111);


              if ((i == 18) && ((value & BigInt(0b0111_1100)) != BigInt(0))){
                throw new Error("Overflow");
              }
              
          
              n |= value << (BigInt(7) * BigInt(i));
          
              if ((byte & BigInt(0b1000_0000)) == BigInt(0)) {
                return {
                    n, 
                    len: i + 1
                }
              }
        }

        throw new Error("Unterminated");
        
    }
}