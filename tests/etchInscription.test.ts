import { Transaction } from 'bitcoinjs-lib'
import { EtchInscription } from '../src/runestones'

import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test Runestone', () => {
    const etchRevealRawTx = '02000000000101dc58870c48618a937cda4ea238587e17413dde50f8fb8de0e87144acea817bbb000000000005000000021027000000000000225120fdaebb6c981431e1c1fce4f292df172db83b6d2b8152ba48bd03d44c5160d60e00000000000000001a6a5d17020304cbfed481d8d9bdbf4c010205530aa08d0608904e03408167e259ab76b6482bdc07f9a856755119da72007ca674b51d767cef82a01c29bcb27504a4b5b168bfe9992248f456958504f668ba99021861d40c56a928b474fdac09203c6d5eb4e0417f17f29a2172aa5ca0a440979717ca04eca147e23d6813317226ac0063036f7264010109696d6167652f706e67010200010d084b3f3580cdf67e4c004d080289504e470d0a1a0a0000000d49484452000000e1000000e10803000000096d224800000072504c5445ffffff000000e4e4e45b5b5bc8c8c8979797d4d4d4e1e1e1494949525252373737f5f5f5b7b7b7252525737373c2c2c29e9e9eeaeaea868686a4a4a4dbdbdb474747616161f0f0f08e8e8eb6b6b6cfcfcf1c1c1cbdbdbd666666424242aaaaaa7777772a2a2a1010102f2f2f1313137e7e7ef2032b23000008a249444154789ced9d6d63aa3c0c86876f53710ae8062abe6efbff7ff151f7084d9b96022d0d9ededf7606b4d71934699aa66f6f1aca9797a0434d739d4e19d4e8bb4bbc87924e014f9df3dd34ee1070e4023008b6dd115edd1006a3ae00d78e008360d311e1cc19e147da0960ba7746187c7742387836b79f76a14f8038ed9470d8456b6f21fc2b9e3b68d22d611766d1316170b2dea46b42fb66d13961f06eb949f7843f96cda27bc2601e5a6d92006130b3da2405c26069b34912844166b1491a8436cd2211428b66910aa13db3488630882d354987d09659a44368cb2c12220c0e569aa44468c72c9222b462166911da308bc4082d0451a9115e8d9b456a84e6cd223942e366911ea169b34890d0b059a44868d62c92240c56069ba44968d22c1225fc31671689120673634d522534b7b64896d05810952ea129b34898d09059a44c68c62c922634621669130606d61689135edacf1689131a982d52276c6f16c913b6364d08028bf409dbda8c1e10b6f4507b40d8321da563c2b70684c1a0558b5d133649d8ed17e1e4e5099b6c0de819e1edcfb8d82e34941f7b4ba8aba127d4932774284fa8294fe8509e50539ed0a13ca1a63ca14379424d794287f2849af2840ee50935153f1ff365a85fe6f4f5ec5ab3eca1385f8fef4a9e8f9947635a8ae6cfae258f9fd7790dd230823bfffba269a4b9247c725829a2a53eb432507e5d77b3957eab010faefbd8529549d299eb1eb656c5b2f7c675ff0c489d4774ac7e00791d55803bd7bd33a2dd4b7f8577a9bec457784995af69fae1ba7346a4a8a135a8bebb1792cf36def11bf6b3739265d9385a9fb6f96a7b8ac6d9f9227ffe75c6e907bd6cce5ea2e5281eb2289fbcc7691a6f76f976fc2bf59ee59bf705c2f3299fc8bcd9cdf617afc727ec14c8d1cb4081cbaa2c938f6c85f5235c6558d9ca1a8413e9a57f1a1d1048712f04daff8536e171adaaa890ae85f1d120e1edf9630d42344b46977059dd091ed128e16db2cc7f0ec87e16cc9dd7233ce814c4e06f324c28f8090861da9070aed50121cbc8382157c415db9324becb3a84915ef3c2c3cd13c23630c250f4252a09af2aff9295dd91e67f7d3137a1fbcab6b5098fba79a3b170ab0dc294b1eaf8ce39c13c5710ea67e18bc97e6d08c37810a3ffb74cad5a9c50b0186ac21adb0cc4c05263c2e4f37b7fb3f0fbefd9588c4d96a65fb2fbf18b7bb69250be55e4e6b1ed6e4d0802ae1bf37bd1796b4cc83a8f439eb11c6c2484fce7a224447de7cd89b5abc7f37a833db70d211c0fb93a23a5c993ed60e5cca68a10d96190aeb1a9dd728579bd8608f9884fe102cb0843388150102211c1049fa004c1f75cfc375384dc54ba5ce2903d1e3a060a42612c7baf57f8de1421f72e15fd97efb306ffdd72c2357f5fdda2e2c608cfe0b7459c0e1066e8254ac23d3f8ed6aeec6f8c10daac220402088fa0b52173b79490f746577501cd11c26a38c5a80d086760a9846d009c0dc012725f618330bc25c2e2664078801d4ecabb6584fc6a7383b54c4b6f69e11e02c2258ccfa6a5eb0396fa1842ce162eea039a238466ab983d00c29bd308ae2a8745306232845c9f9a1c90628c101e0713a184093ff8170f01034a49c86d276cb492628af0078eea858bcf137e80cb0a270b54942f09b942f38d56a44d11726be6c51706ed61c0d985c2ec4b083977b7514e8121c283ec5e81f0135cf8346f60042a09a1ad68b6ce6086f0ccdd5b0e2180f031a9827f97a99210befac2fc3d5a611a0dc14526088fc2fca61cf300e163fc41cd0a38d3a920e4dc79c19f91c455ce66089f31adcf4c6c87893401c23f9f1246cda60a422e7f4e704925f1b7a519c29bc18edf25b9558cd94208e174e3cf020077ae20e46a24088bd2b609a562e7370821673a1f3c671d42d8738784c02e03c22df26f7fce34602908cff0c1f0fb72470897253042ee94b17b4d0802dc0d581b192191b73486661925bc803beec153308790bda59d8f34a876dc2a29202ca606d0039a7126444628580b1784c28b0408cb581fb869c1593e99b5101cefee0957e2ec46420883137b18d62e08f960b7668f6c11865b6cf6060899d70cf43d0aae2821e7b509c1f0d9d7ff82afb315c2c14230566a42e08886d0c72e41b8de49e36c7b1b84bbdd260ec3c164b4cac74324d48c11b2ae3370877ec18f25213727934e2ee0acd310a1e6719652c2256c8b7d784978e6fa24cb59b642a899f50608c16008563a66ac13208fd3c882893409c154386727f90c219fe2cbaf3b9226845361f68b6308f9ec50647d903021f4dd70c23dff3b3cdc4694505a7394357bc299d55180882aa1b0ae84108a490a9851a44a28cbc106ae8b784e0792fa47965052721410225f6b98f0cfa14b8817ab84ee2776c06acc339225c4b7b4cc34ae0927e3c255bc9e61209d14219aedc411ca06a49bd2cd0609f7912244cb71f293a4badb8e691162b91a425e5bcd7dc7b40831b32fe626d6432446c84f1f5042fdfc528a84a2d9c77284f735eae7522314b7d0e379debfdae5bac9110a665fb61b4133979d1ea160d2a5fb2dae5175218174cbc5c43a25941495e5ed9d6a57d0d74251f962304ac47b6b108e4246da84ec4db29ab2ab103cba6267d73cc945476e9347073cdba606212dcd0fd9388ad6d1385b0e95bb5d7b4ba8ad7f995012d6ea9de4c36f78714d3901dd3723529deb3175dd3923529d2580c6ed7a279523f41a438d72dba96449b057521fccf20aa3698523db24ad9a96166ac0fe0f361af32d713f6b9fb4ad06bc0da8c3ea0711d55067f7fe5d934473c99e94ae89762ae55df1647457f1ca4e77235ada15fed7f6f1f3a4e1e1ab85f5205cfbb2ddb9b2af5fddd3133a9427d4942774284fa8294fe8509e50539ed0a13ca1a63ca14379424d794287f2849af2840ee50935e5091dca136aca133a9427d4942774284fa8294fe8509e50539ed0a13ca1a63ca14379424d1584d3cd84963653c38484e509ff75c294fec9b9fb3afb8511551d88e65e35ce6b4155f75882ee259ca45057d4b385af6d0191b38668492c66535bb54f97e8545a07715769d4a4b47d37fa36f0177c285f5e5cb320ba2c859a5998fe039470a21c8244e44b0000000049454e44ae4260826821c03c6d5eb4e0417f17f29a2172aa5ca0a440979717ca04eca147e23d681331722600000000'

    it('should correctly decipher and encipher etch inscription', async () => {
        const inscription = EtchInscription.decipher(etchRevealRawTx, 0)
        
        console.log(inscription)
        
    })

    // TODO: Negative cases

})
