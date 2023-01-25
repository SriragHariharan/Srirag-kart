var express = require('express');
var router = express.Router();

const adminHelpers = require('../helpers/admin-helpers');
const session = require('express-session');

const adminLogger = (req, res, next) => {
  if(req.session.admin){
    next()
  }else{
    res.redirect('/admin/login')
  }
}



/* GET home page. */
router.get('/',adminLogger, function(req, res) {
  
    let WelcomeBackmsg    = req.flash('AdminLoginSuccessMsg');
    let itemAddedTosales  = req.flash('itemAddedTosales')
    res.render('admin/admin-homepage.hbs',{  WelcomeBackmsg, itemAddedTosales, admin:true, adminLogin:req.session.admin});
});

router.get('/login', (req, res) => {
    if(req.session.adminLoggedin){
      res.redirect('/admin')
    }else{
      let LoginErrorMsg = req.flash('AdminLoginErrorMsg')
      res.render('admin/admin-login.hbs',{LoginErrorMsg, admin:true, adminLogin:req.session.admin})
    }
});

router.post('/login', (req, res) => {
  adminHelpers.verifyAdmin(req.body)
  .then(response => {
    if(response){
      req.session.admin = req.body
      req.session.adminLoggedin=true
      req.flash('AdminLoginSuccessMsg', `Hi Admin,  Welcome Back`)
      res.redirect('/admin/')
    }else{
      req.flash('AdminLoginErrorMsg', `Email id or password is wrong !`)
      res.redirect('/admin/login')
    }
  })
});


router.get('/logout',adminLogger, (req,res) => {
  req.session.admin=null
  req.session.adminLoggedin=false
  res.redirect('/admin/login')
});


router.get('/add-new-product', adminLogger, (req, res) => {
  res.render("admin/add-new-product.hbs", {admin:true, adminLogin:req.session.admin})
})


router.post('/add-new-product',adminLogger, (req, res) => {
  adminHelpers.addNewProduct(req.body).then((prodID) => {
    //below code is written to move an image to an another folder
    let image1 = req.files.productImage01;
    let image2 = req.files.productImage02;
    let image3 = req.files.productImage03;
    let image4 = req.files.productImage04;
    adminHelpers.addnewProductImages(prodID, image1, image2, image3, image4)
    .then((response) => {
      req.flash('itemAddedTosales', `Your product has been added successfully for sales`)
      res.redirect('/admin/')
    })  
  })
})

router.get('/view-and-edit-product/:id', adminLogger , (req, res) => {
  let prodID = req.params.id;
  adminHelpers.viewProduct(prodID)
  .then(product => {
    res.render('admin/view-product.hbs', {product, admin:true, adminLogin:req.session.admin})
  })
})


router.post('/update-product/:id',adminLogger, (req, res) => {
  let productID = req.params.id
  adminHelpers.updateProduct(productID, req.body).then((response) => {
      res.redirect('/admin')
  })
  
  if(req.files.productImage01){
    adminHelpers.replaceImage1(req.files.productImage01, productID).then(()=> resolve()) 
  }

  if(req.files.productImage02){
    adminHelpers.replaceImage2(req.files.productImage02, productID).then(()=> resolve())
  }

  if(req.files.productImage03){
    adminHelpers.replaceImage3(req.files.productImage03, productID).then(()=> resolve())
  }

  if(req.files.productImage04){
    adminHelpers.replaceImage4(req.files.productImage04, productID).then(()=> resolve())
  }
});


router.get('/delete-product/:id', (req, res) => {
  productID = req.params.id;
  adminHelpers.deleteProduct(productID).then(() => {
    res.redirect('/admin/');
    //delete image from product-images file
    const path1 = './public/product-images/'+productID+"-01.jpg"
    const path2 = './public/product-images/'+productID+"-02.jpg"
    const path3 = './public/product-images/'+productID+"-03.jpg"
    const path4 = './public/product-images/'+productID+"-04.jpg"
    adminHelpers.deleteProductImages(path1, path2, path3, path4).then(response => resolve())
  })
});


router.get('/orders/', adminLogger, async(req, res) => {
  adminHelpers.getOrders()
  .then(orders => {
    res.render('admin/admin-orders.hbs', {admin:true, orders, adminLogin:req.session.admin})
  })
});


router.get('/view-order/:id', adminLogger, (req, res) => {
  adminHelpers.getOrder(req.params.id).then(orderProducts => {
    res.render('admin/view-order.hbs', {admin:true, adminLogin:req.session.admin, orderProducts})
  })
});


router.get('/order-status', adminLogger, (req, res) => {
  let orderID = req.query.orderID;
  let orderStatus = req.query.status;
  adminHelpers.changeOrderStatus(orderID, orderStatus).then((response) => {
    console.log(response);
    res.redirect('back')
  })
});

router.get('/view-products/', (req, res) => {
  adminHelpers.getAllProducts().then((products) => {
    res.render('admin/admin-view-all-products.hbs', { products, adminLogin:req.session.admin, admin:true})
})
});


//SUPER ADMIN FEATURES !

router.get('/add-new-admin',(req, res) => {
  res.render('admin/add-new-admins.hbs',{admin:true})
});

router.post('/add-new-admin', (req, res)=> {
  adminHelpers.addNewAdmin(req.body).then((response) =>{
    res.redirect('/admin/add-new-admin')
  })
})


//404 error
// router.get('*', function(req, res){
//   res.render('error.hbs');
// });


module.exports = router;

