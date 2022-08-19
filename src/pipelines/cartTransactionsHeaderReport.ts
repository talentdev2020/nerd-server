import {CartStatus, EBrands, EPurchasedProductsBrandOrigin} from "src/types";
import {config} from 'src/common';

let categoryStatement:object|string=EPurchasedProductsBrandOrigin.PURCHASED_IN_CURRENT_BRAND.valueOf();

//TODO improve if posible the categoryStatement for otherBrands;
if (config.brand.toUpperCase() !== EBrands.CONNECT.valueOf())
  categoryStatement = {$cond:[ {$gte:[{$indexOfArray: [{$ifNull:["$linkedTransactions.brand",[]]},"connect"]},0]},EPurchasedProductsBrandOrigin.PURCHASED_IN_CONNECT_BRAND.valueOf(),EPurchasedProductsBrandOrigin.PURCHASED_IN_CURRENT_BRAND.valueOf()]};


const getPipeline = (startDate:Date, endDate:Date) => [
  {
    $match: {
      status:CartStatus[CartStatus.complete],
      created: { $gte: new Date(startDate), $lte: new Date(endDate) },
    },
  },     
  {   
    $addFields: {      
      productName:{ $ifNull: ['$productName', 'Unknown Name'] },    
      category: categoryStatement,
    },
  },
  {
    $group: {
        _id:{category:"$category",productName:"$productName"},
        quantityPurchasedSum:{$sum: {$ifNull:["$quantity",1]}},
        transactionsCount:{$sum:1},
        totalRevenueUsdSum:{$sum:"$revenueUsd"},
    },
  },
  {
    $group: {
        _id:"$_id.category",        
        products:{
            $push: { 
              productName: '$_id.productName',
              quantityPurchasedSum:"$quantityPurchasedSum",
              transactionsCount:"$transactionsCount",        
              totalRevenueUsdSum:"$totalRevenueUsdSum",
            },
        },
        totalRevenueUsdByCategory:{$sum:"$totalRevenueUsdSum"},        
    },
  },  
  {
      $group:{
          _id:null as object,
          productsByCategory:{
             $push: { 
              products:"$products",
              category:"$_id",
            }, 
          },
          grandTotalRevenueUsdSum:{$sum:"$totalRevenueUsdByCategory"},
      },
  },
  {
    $addFields: {                  
        _id:"$$REMOVE",
    },  
  },
];
export default getPipeline;


// const startDate = new Date(0);
// const endDate =  new Date(ISODate());
// const pipeline = getPipeline(startDate,endDate);

// db.getCollection("cart-transaction-mocks").aggregate(pipeline);
