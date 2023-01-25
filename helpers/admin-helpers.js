const express = require('express')
const bcrypt = require('bcrypt');
const db = require('../configsDB/connection')
const collections = require('../configsDB/collections');
var objectID = require('mongodb').ObjectId
const fs = require('fs')

module.exports = {

//   this snippet of code is used to add an admin by super admin
//   can/Will be deleted in the mere Future
    addNewAdmin: (newAdminDetails)=> {
        return new Promise(async(resolve, reject) => {
            console.log(newAdminDetails);
            newAdminDetails.adminPwd = await bcrypt.hash(newAdminDetails.adminPwd, 10);
            db.get().collection(collections.ADMIN_CREDENTIALS).insertOne(newAdminDetails)
            .then(response => {
                resolve(response)
            })
        })

    },

// here verification of admin is done.    data from the form is validated with data in the database
    verifyAdmin : (adminLoginCredentials)=> {
        return new Promise(async(resolve, reject) => {
            let dbEmailofAdmin = await db.get().collection(collections.ADMIN_CREDENTIALS).findOne({adminEmail:adminLoginCredentials.adminEmail})
            if(dbEmailofAdmin){
                let validation2 =await bcrypt.compare(adminLoginCredentials.adminPwd,dbEmailofAdmin.adminPwd)
                if(validation2){
                    resolve(true)
                }else{
                    resolve(false)
                }
            }else{
                resolve(false)
            }
        })
    },

//code snippet is written to add a new product to cart for sales from admin side !

addNewProduct : (newProductDetails) => {
    return new Promise(async(resolve, reject) => {
        newProductDetails.productPrice = parseInt(newProductDetails.productPrice)
        newProductDetails.productStock = parseInt(newProductDetails.productStock)
       await db.get().collection(collections.PRODUCT_COLLECTION).insertOne(newProductDetails)
       .then(response => resolve(response.insertedId))
    })
},


//used to collect details of all products added in a products collection
getAllProducts : ()=> {
    return new Promise(async(resolve, reject) => {
        let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
        resolve(products)
    })
},


//to get data of an individual product
viewProduct : (prodID) => {
    return new Promise(async(resolve, reject) => {
        let product = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectID(prodID)});
        resolve(product)
    })
},

//update product
updateProduct : (productID, productBody)=> {
    return new Promise(async(resolve, reject) => {
       await db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id : objectID(productID)},
        {
            $set:{
                productName:productBody.productName,
                productPrice:productBody.productPrice,
                productStock: productBody.productStock,
                productDescription:productBody.productDescription,
                category:productBody.category
            }
        }).then((response) => {
            resolve(response)

        })
    })
},

deleteProduct : (productID) => {
    console.log("Product ID :" + productID);
     return new Promise(async(resolve, reject) => {
        await db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id : objectID(productID)})
        .then((response) => {
            resolve(response);
        })
     })
},

getOrders : () => {
    return new Promise(async(resolve, reject) => {
        await db.get().collection(collections.ORDERS_COLLECTION).find().sort({date:-1}).toArray()
        .then(response => resolve(response))
    })
},

getOrder : (orderID) => {
    return new Promise(async(resolve, reject) => {
        await db.get().collection(collections.ORDERS_COLLECTION).findOne({_id : objectID(orderID)})
        .then(response => resolve(response))
    })
},

changeOrderStatus : (orderID, orderStatus) => {
    return new Promise(async(resolve, reject) => {
        await db.get().collection(collections.ORDERS_COLLECTION).updateOne(
            {_id:objectID(orderID)},
            {$set:{status:orderStatus}}
        ).then(response => resolve(orderStatus))
    })
},



//++++++++++++++++++++++++++++++Image management codes++++++++++++++++++++++++++++++++++++++++


//below code is used to add new images collected from a add-new-product form to product-images folder

addnewProductImages: (prodID, image1, image2, image3, image4) => {
    return new Promise((resolve, reject) => {

        image1.mv('./public/product-images/'+ prodID +"-01.jpg" , (err) => {  if (!err) { console.log("Pic 1 stored"); }
        })
      
        image2.mv('./public/product-images/'+ prodID +"-02.jpg" , (err) => {  if (!err) { console.log("Pic 2 stored"); }
        })
      
        image3.mv('./public/product-images/'+ prodID +"-03.jpg" , (err) => {  if (!err) { console.log("Pic 3 stored"); }
        })
      
        image4.mv('./public/product-images/'+ prodID +"-04.jpg" , (err) => {  if (!err) { console.log("Pic 4 stored"); }
        })
        resolve(true)
    });
},



//below code snippets are used to replace individual images collected from admin edit product form

replaceImage1 : (image1, prodID) => {
    return new Promise((resolve, reject) => {
        image1.mv('./public/product-images/'+ prodID +"-01.jpg" , (err) => {  if (!err) { console.log("Pic 1 stored"); }
            })
            resolve(true)
    })
},

replaceImage2 : (image2, prodID) => {
    return new Promise((resolve, reject) => {
        image2.mv('./public/product-images/'+ prodID +"-02.jpg" , (err) => {  if (!err) { console.log("Pic 2 stored"); }
            })
           resolve(true)
    })
},

replaceImage3 : (image3, prodID) => {
    return new Promise((resolve, reject) => {
        image3.mv('./public/product-images/'+ prodID +"-03.jpg" , (err) => {  if (!err) { console.log("Pic 3 stored"); }
            })
            resolve(true)
    })
},
replaceImage4 : (image4, prodID) => {
    return new Promise((resolve, reject)=> {
        image4.mv('./public/product-images/'+ prodID +"-04.jpg" , (err) => {  if (!err) { console.log("Pic 4 stored"); }
            })
            resolve(true)
    })
},

deleteProductImages : (path1, path2, path3, path4) => {
    return new Promise((resolve, reject) => {
        try {
            fs.unlinkSync(path1);
            console.log("Image 1 removed");
        } catch (error) {
           console.error(error); 
        }
        try {
            fs.unlinkSync(path2);
            console.log("Image 2 removed");
        } catch (error) {
           console.error(error); 
        }
        try {
            fs.unlinkSync(path3);
            console.log("Image 3 removed");
        } catch (error) {
           console.error(error); 
        }
        try {
            fs.unlinkSync(path4);
            console.log("Image 4 removed");
        } catch (error) {
           console.error(error); 
        }
        resolve(true)
    })



},



//final closure of braces
}
  





