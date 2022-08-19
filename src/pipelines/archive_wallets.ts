export const getArchiveWalletsUpdatePipeline = () => ([
  {
      $set:{
          walletArchive: {
              $concatArrays:[
                  {$ifNull:["$walletArchive",[] as object]}, 
                   [{
                       ethAddress:"$wallet.ethAddress",
                       btcAddress:"$wallet.btcAddress",
                       ethBlockNumAtCreation:"$wallet.ethBlockNumAtCreation",
                       created: new Date(),
                   }],
               ], 
          },
      },
  },
  {
       $unset:[
           "wallet.ethAddress",
           "wallet.btcAddress",
           "wallet.ethBlockNumAtCreation",
       ],
  },
]);