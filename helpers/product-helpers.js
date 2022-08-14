var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')

module.exports = {

     addProduct: (product, callback) => {
        db.get().collection('product').insertOne(product).then((data) => {
            console.log(data) 
            callback(data.insertedId)
        })

    },

    gatAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(products)
        })

    },

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then(() => {
                //console.log(response);
                resolve()
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        Name: proDetails.Name,
                        Descryption: proDetails.Descryption,
                        Price: proDetails.Price,
                        Category: proDetails.Category
                    }
                }).then((response) => {
                    resolve()
                })
        })
    },
    adminSignup: (adminData) => {
        return new Promise(async (resolve, reject) => {
            adminData.Password = await bcrypt.hash(adminData.Password, 10)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data) => {
                resolve(data.insertedId)
            })
        })
    },

    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
            if (admin) {
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {
                    if (status) {
                        console.log('login success')
                        response.admin = admin
                        response.status = true
                        resolve(response)


                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }

                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },

    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orderDetails)
        })

    },
    getAllUsersList: () => {
        return new Promise(async (resolve, reject) => {
            let allUsers = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(allUsers)


        })
    },
    getPlacedOrders: () => {
        return new Promise(async (resolve, reject) => {
            let placedOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ status: 'placed' }).toArray()
            resolve(placedOrders)
        })
    },
    changeStatusPlaced: (orderId) => {
        console.log('ORDERID:' + orderId)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'Shipped'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    deleteOrder:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({ _id: objectId(orderId) }).then(() => {
                //console.log(response);
                resolve()
            })
        })
    }

}