var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { CART_COLLECTION, PRODUCT_COLLECTION } = require('../config/collections')
var objectId=require('mongodb').ObjectId
var Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_Z6TlCxnmz74J1D',
    key_secret: 'pm1JnykZa7D3ZxpokHVMriy7',
  });
module.exports = {
     doSignup: (UserData) => {
        return new Promise(async (resolve, reject) => {
            UserData.Password = await bcrypt.hash(UserData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(UserData).then((data) => {
                console.log(data);
                resolve(data.insertedId)

            })
        })


    },
    
    doLogin: (UserData) => {
               return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: UserData.Email })
            if (user) {
                bcrypt.compare(UserData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('login success')
                        response.user=user
                        response.status=true
                        resolve(response)
                        

                    } else {
                        console.log('login failed');
                         resolve({status:false})
                    }

                })
            } else {
                console.log('login failed');
                resolve({status:false})
            }
        })
    },

    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async (resolve,reject)=>{
            let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart){
            let proExist=userCart.products.findIndex(product=>product.item==proId)
            if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
            }else{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userId)},
            {
                $push:{
                    products:proObj
                }
            }
            ).then((response)=>{
                resolve()
            })
        }


        }else{
            let cartObj={
                user:objectId(userId),
                products:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()
            })
        }
        })
        
    },
    getCartProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        
                    }

                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()
           // console.log(cartItems[0].product)
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async  (resolve,reject)=>{
            let count=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if (cart){
             count = cart.products.length

            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        quantity= parseInt(details.quantity)
      count=parseInt(details.count)
      if(details.quantity==1&&details.count==-1){
          return new Promise((resolve,reject)=>{
             db.get().collection(collection.CART_COLLECTION)
             .updateOne({_id:objectId(details.cart)},
             {
                 $pull:{products:{item:objectId(details.product)}}
             }
             ).then((response)=>{
                 resolve({removeProduct:true})
             })
          })
      }else{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':count}
                }).then((response)=>{
                    console.log(response);
                    resolve({status:true})
        })
    })
      }
     
        
    },
    removeCartProduct:(details)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve(response)
            })
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let total= await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }

                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $project:{
                        quantity:{$toInt:'$quantity'},
                        price:{$toInt:'$product.Price'}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$price']}}
                    }
                }
                
            ]).toArray()
            //console.log(total[0].total)
            if(total[0]){
                resolve(total[0].total)
            }else{
                resolve([])
            }
           
        })

    },
     placeOrder:(order,total,products)=>{
        return new Promise((resolve,reject)=>{
            let response={}
           let status=order['payment-method']==='COD'?'placed':'pending'
           let orderObj={
               deliveryDetails:{
                   mobile:order.mobile,
                   address:order.address,
                   pincode:order.pincode,

               },
               userId:objectId(order.userId),
               paymentMethod:order['payment-method'],
               totalAmount:total,
               status:status,
               products:products,
               date:new Date()
            
           }
           db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((Id)=>{
               db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
            console.log(Id);
            response.codSuccess=order['payment-method']
            response.insertedId=Id.insertedId
            console.log('order id:'+Id.insertedId);
               resolve(response)

           })
           
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.products);
            
        })
    },
       checkCartList:(userId)=>{
        return new Promise (async (resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                resolve({status:true})
            }
    
            
            
        })
    },
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
           resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise (async (resolve,reject)=>{
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        
                    }

                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()
          console.log(orderItems);
            resolve(orderItems)
        })
        
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                      console.log(err);
                  }else{
                    console.log('New Order:',order);
                    resolve(order)
                  }
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise ((resolve,reject)=>{
            const crypto = require("crypto");
            let hmac= crypto.createHmac('sha256', 'pm1JnykZa7D3ZxpokHVMriy7')
            hmac.update(details['payment[razorpay_order_id]']+"|"+details['payment[razorpay_payment_id]'])
           hmac= hmac.digest('hex')
           if(hmac==details['payment[razorpay_signature]']){
               resolve()
           }else{
               reject()
           }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }

}