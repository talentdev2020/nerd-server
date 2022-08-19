export const updateAndStoreCartProductCostPipeline = (costUpfront:number) => ([
  {
      $set:{
        costHistory: {
              $concatArrays:[
                  {$ifNull:["$costHistory",[] as object]}, 
                   [{
                     costUpfront:"$costUpfront",
                     dateArchived: new Date(),
                   }],
               ], 
          },
      },
  },
  {
       $set:{
        costUpfront,
       },
  },
]);