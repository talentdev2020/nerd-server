export const getPipeline = (userId:string) => [
  {
    $match: {
      id: userId,
    },
  },
  {
    $project: {
      _id: 0,
      affiliateId: 1,
    },
  },
  {
    $lookup: {
      from: 'users',
      as:'affiliates',
      let: {
        affiliateId: '$affiliateId',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$referredBy', '$$affiliateId'],
            },
          },
        },
        {
        $project: {
            _id:0,
            email:1,
            firstName:1,
            lastName:1,
            id:1,
          },
        },        
    ],
    },
  },  
  {    
    $unwind: {
      path: '$affiliates',    
    },
  },
  {
     $replaceRoot:{
        newRoot: "$affiliates", 
    }, 
  },
  {
    $lookup: {
      from: 'licenses',
      as:'nodesSummary',
      let: {
        affiliateUserId: '$id',
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$userId', '$$affiliateUserId'],
            },
          },
        },        
        {          
          $group: {
            _id: "$licenseTypeId",
            licensesCount:{$sum:1},
          },
        },
        {
          $lookup:{
            from: 'license-types',
            as:'licensesTypes',
            let: {
             licenseTypeId: '$_id',
            },
            pipeline:[
              {
                $match: {
                  $expr: {
                    $eq: ['$id', '$$licenseTypeId'],
                  },
                },
              },
              {                
                $project: {
                  _id:0,                  
                  nodeType:1,     
                  // nodeType:"small",                  
                },
              },        
            ],
          },
        },
        {    
          $unwind: {
            path: '$licensesTypes',      
            preserveNullAndEmptyArrays: true,
          },
        },        
        {
          $group:{
            _id:"$licensesTypes.nodeType",
            totalNodes:{$sum:"$licensesCount"},
          },
        },
        {                   
          $addFields: {
              _id:"$$REMOVE",
              nodeType:"$_id",
          },          
        },
      ],
    },
  },
  {    
    $addFields: {
      id:"$$REMOVE",
      nodesSummary: '$$REMOVE', 
      largeNodeCount: {          
          $filter:
          {
            input: '$nodesSummary',
            as: "largeNode",
            cond: {
              $eq: ["$$largeNode.nodeType", "large"],
            },
          },          
      },
      smallNodeCount: {          
          $filter:
          {
            input: '$nodesSummary',
            as: "smallNode",
            cond: {
              $eq: ["$$smallNode.nodeType", "small"],
            },
          },          
      },
    },
  },
  {    
    $addFields: {
      largeNodeCount:{ $first: "$largeNodeCount"},
      smallNodeCount:{ $first: "$smallNodeCount"},
    },
  },
  {    
    $addFields: {
      largeNodeCount:{$ifNull:["$largeNodeCount.totalNodes",0]},
      smallNodeCount:{$ifNull:["$smallNodeCount.totalNodes",0]},
    },
  },
]