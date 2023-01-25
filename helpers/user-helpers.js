const express= require('express');
const db= require("../configsDB/connection");
const collections = require("../configsDB/collections")
var objectID = require('mongodb').ObjectId
const bcrypt = require('bcrypt');

const Razorpay = require('razorpay');
var instance = new Razorpay({ key_id: 'rzp_test_T2L1gw7beUHoqr', key_secret: 'Jv6iQQrTUZzTLWCXLeGzvtdR' })

module.exports={

    get8Products : () => {
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().limit(8).toArray()
            resolve(products)
        })
    },

    getAllProducts : () => {
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    viewProduct : (productID) => {
        return new Promise(async(resolve, reject) => {
           let product = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id : objectID(productID)})
           resolve(product)
        })
    },

    addNewUser : (newUserData) => {
        return new Promise(async(resolve, reject) => {
            newUserData.password1 = await bcrypt.hash(newUserData.password1, 10);
            newUserData.password2 = await bcrypt.hash(newUserData.password2, 10);
            await db.get().collection(collections.USER_COLLECTION).insertOne(newUserData)
            .then(response => resolve(response))
        })
    },

    validateLogin : (loginData) => {
        let resFromUserValidation={}
        return new Promise(async(resolve, reject) => {
            let userDataFromDB = await db.get().collection(collections.USER_COLLECTION).findOne({mobileNumber : loginData.mobileNumber})
            if(userDataFromDB){
                let status = await bcrypt.compare(loginData.password, userDataFromDB.password1)
                if(status){
                    resFromUserValidation.data = userDataFromDB;
                    resFromUserValidation.status = true;
                    resolve(resFromUserValidation);
                }else{
                    resFromUserValidation.status = false;
                    resolve(resFromUserValidation);
                }
            }else{
                resFromUserValidation.status = false;
                resolve(resFromUserValidation);
            }
            
        })
    },

    checkMobileNumber : (dataFromUserSignupForm) => {
        return new Promise(async(resolve, reject) => {
            let userDataFromDB = await db.get().collection(collections.USER_COLLECTION).findOne({mobileNumber : dataFromUserSignupForm.mobileNumber})
            if(userDataFromDB){
                resolve(true)
            }else{
                resolve(false)
            }
        })

    },

    updateProfile : (userID, dataFromUpdateProfileForm) => {
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collections.USER_COLLECTION).updateOne({_id : objectID(userID)},
            {
                $set:{
                    username:dataFromUpdateProfileForm.username,
                    mobileNumber:dataFromUpdateProfileForm.userMobile,
                    email:dataFromUpdateProfileForm.userEmail,
                    address:dataFromUpdateProfileForm.address
                }
            })
            let userDataFromDB = await db.get().collection(collections.USER_COLLECTION).findOne({_id : objectID(userID)})
            resolve(userDataFromDB)
        })
    },

    addToCart : (userID, productID) => {
        let productObj = {
            item:objectID(productID),
            quantity:1
        }

        let cartObject={
            user:objectID(userID),
            products:[productObj]
        }

        return new Promise(async(resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectID(userID)})
            if(userCart){
                //here array is refered as the array of products stored in cart collection
                //findIndex() is used to find index value of item present in an array
                //if present it will return an index between 1 and infinity
                //else if not present it will return -1

                // let isItemPresent = (array) => {   return array.item == productID    }//arrow func
                // let cartItem = userCart.products.findIndex(isItemPresent)

                let cartItem = userCart.products.findIndex(array => array.item == productID)
                if(cartItem != -1){
                    db.get().collection(collections.CART_COLLECTION).updateOne(
                        {user: objectID(userID), 'products.item' : objectID(productID)},
                        {
                            $inc:{'products.$.quantity': 1}
                        }).then(response => resolve())
                }else{
                    db.get().collection(collections.CART_COLLECTION).updateOne({user:objectID(userID)},
                    {
                        $push:{products:productObj}
                    }).then(response => resolve())
                }
                
            }
            else{
                
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObject)
                .then(response => resolve())
            }
        })
    },

    
    getCartProducts : (userID) => {
        return new Promise(async(resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectID(userID)})
            if(cart){
                let cartProducts =await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {$unwind:"$products"}, 
				    {$project:{_id:0, item:"$products.item", quantity:"$products.quantity"}},
				    {$lookup:{
                                from:collections.PRODUCT_COLLECTION,
                                localField:"item", 
                                foreignField:"_id", 
                                as:"productDetails"}
                            },
				    {$project:{
                                _id:0,
                                "productDetails.productStock":0, 
                                "productDetails.productDescription":0,
                                "productDetails.category":0
                            }
                    }
                ]).toArray()
                resolve(cartProducts)
            }
        })
    },

    getCartCount : (userID) => {
        return new Promise(async(resolve, reject) => {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:objectID(userID)})
            if(cart===null){
                resolve(0)
            }else{
                resolve(cart.products.length)
            }
        })
    },   

    getCartTotal : (userID) => {
        return new Promise(async(resolve, reject) => {
            let cartTotal =await db.get().collection(collections.CART_COLLECTION).aggregate([
                 {
                     $match:{user: objectID(userID)}
                 },
                 {
                     $unwind:'$products'
                 },
                 {
                     $project:{item:'$products.item',quantity:'$products.quantity'}
                 },
                 {
                     $lookup:{
                             from:collections.PRODUCT_COLLECTION,
                             localField:'item',
                             foreignField:'_id',
                             as:'product'
                             } 
                 },
                 {
                     $project : {_id:0, quantity:1, product:{$arrayElemAt:['$product',0]}}
                 },
                 {
                     $group:{_id:null, total:{$sum:{$multiply:["$quantity", "$product.productPrice"]}}}
                 }
                 ]).toArray()
                 if(cartTotal){
                     resolve(cartTotal[0].total)
                 }else{
                     resolve(false);
                 }
        })           
    },

    deleteCartProduct :(productID, userID) => {
        return new Promise(async(resolve, reject) => {
            let cart =await db.get().collection(collections.CART_COLLECTION).findOne({user:objectID(userID)})
            console.log(cart);
            if(cart===null){
                console.log("Cart is empty");
                resolve(false)
            }
            else if(cart.products.length ==1){
                await db.get().collection(collections.CART_COLLECTION).deleteOne({user:objectID(userID)})
                .then(response => resolve(false))
            }else{
                await db.get().collection(collections.CART_COLLECTION).updateOne(
                        {user:objectID(userID)},
                        {
                        $pull:{products:{item:objectID(productID)}}
                        }).then(response => resolve(true))
            }
        })
    },

    getProductsByBrand : (brand) => {
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({brand:brand}).toArray()
            resolve(products)
        })
    },

    incrementProductQuantity : (userID, productID) => {
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collections.CART_COLLECTION).updateOne(
                {   user:objectID(userID), 'products.item':objectID(productID)},
                {
                    $inc:{'products.$.quantity': 1}
                }
            ).then(response => resolve())
        })
    },

    decrementProductQuantity : (userID, productID) => {
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collections.CART_COLLECTION).updateOne(
                {   user:objectID(userID), 'products.item':objectID(productID)},
                {
                    $inc:{'products.$.quantity': -1}
                }
            ).then(response => resolve())
        })
    },
    
    getUserDetails : (userID) => {
        return new Promise(async(resolve, reject) => {
            let userDetails=db.get().collection(collections.USER_COLLECTION).findOne({_id : objectID(userID)})
            resolve(userDetails)
        })
    },

    placeOrder : (userDetails, cartProducts, cartTotal, paymentMethod ,userID) => {
        console.log(cartProducts);
        return new Promise(async(resolve, reject) => {
            let CartTotal=parseInt(cartTotal)
            let orderObj={
                        id:userDetails.mobileNumber,
                        name:userDetails.username,
                        email:userDetails.email,
                        address:userDetails.address,
                        paymentMethod:paymentMethod,
                        date:new Date(),
                        status:'Order Placed',
                            grandTotal:cartTotal,
                            products:cartProducts,
            }
            await db.get().collection(collections.ORDERS_COLLECTION).insertOne(orderObj) 
            .then( response => {
                resolve(response.insertedId)   
                 db.get().collection(collections.CART_COLLECTION).deleteOne({user:objectID(userID)})   
            })
        })
    },

    getOrders : (userID) => {
        return new Promise(async(resolve, reject) => {
            let orders = await db.get().collection(collections.ORDERS_COLLECTION).aggregate([
                {	$match:     {id:userID}		},
                {	$project:   {	_id:1, date:1, paymentMethod:1, status:1, 'products.quantity':1, 'products.productDetails':1	} },
                {	$sort:{date:-1} }
                ]).toArray()
                resolve(orders)   
        })
    },

    generateRZPOrder : (response, cartTotal) => {
            return new Promise(async(resolve, reject) => {

                let RZPorder = await instance.orders.create({
                amount: cartTotal*100,
                currency: "INR",
                receipt:""+ response
              });
              resolve(RZPorder)
        })
    },

    RZPamountReceived : (userMobile) => {
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collections.ORDERS_COLLECTION).updateOne({id:userMobile},
                {$set:{ "paymentSuccessfull" : "Successfull"}    })
                .then(response => {
                    console.log(response);
                    resolve()
                })
        })
    },


    getCategory :(category) => {
        return new Promise(async(resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({category:category}).toArray()
            resolve(products)
        })
    }
    

}
