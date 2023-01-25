var express = require('express');
var router = express.Router();
var userHelpers = require("../helpers/user-helpers")




userLogger = (req, res, next) => {
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}


/* GET users listing. */
router.get('/',async function(req, res, next) {
  let cartCount=null
  let user=req.session.user;
  if(user){
    cartCount=await  userHelpers.getCartCount(req.session.user._id)
    user.Count=cartCount
  }
  let userLoginSuccessfull = req.flash('userloginSuccessfull')
  let emptyCart = req.flash('cartIsEmpty')
  let orderPlacedSuccessfully = req.flash('orderPlacedSuccessfully')
  let products = await userHelpers.get8Products()
    res.render('user/user-homepage.hbs', {user:true, products, userSession:req.session.user, userLoginSuccessfull, cartCount, emptyCart, orderPlacedSuccessfully});
});

router.get('/view-all-products/', async(req, res) => {
  let products = await userHelpers.getAllProducts()
  // res.json({"products":products})
  res.render('user/view-all-products.hbs', {products, user:true, userSession:req.session.user})
})


router.get('/view-product/:id', (req, res) => {
  let productID = req.params.id;
  userHelpers.viewProduct(productID).then(product => res.render('user/user-view-product.hbs', {user:true, product, userSession:req.session.user}))
});

router.get('/signup/', (req, res) => {
  let signUpErrorMessage = req.flash('userSignupError')
  let mobileNumberError = req.flash("mobileNumbererror")
  let mobileNumberExists = req.flash("mobileNumberExists")
  res.render('user/user-signup.hbs', {user:true, signUpErrorMessage, mobileNumberError, mobileNumberExists})
});

router.post('/signup/', async(req, res) => {
  let status = await userHelpers.checkMobileNumber(req.body)
  if(status){
    req.flash("mobileNumberExists",`Sorry, The mobile number you entered is already having an account in our website`);
    res.redirect('/user/signup')
  }
  else if(req.body.mobileNumber.length != 10){
    req.flash("mobileNumbererror",`Mobile number should be of ten digits`)
    res.redirect('/signup')
  }
  else if(req.body.password1 != req.body.password2){
    req.flash('userSignupError', `Passwords doesnot match`);
    res.redirect('/signup')
  }else{
    req.session.user=req.body;
    userHelpers.addNewUser(req.body).then(response => {
      res.redirect('/')
    })
  }
});

router.get('/logout', (req, res) => {
  req.session.user=null;
  res.redirect('/')
});

router.get('/login', (req, res) => {
  let messageForLoginToAddToCart = req.flash('messageForLoginToAddToCart')
  let userloginFailed = req.flash('userloginFailed')
  let buyNowLogin = req.flash('buyNowLogin')
  res.render('user/user-login.hbs', {user:true, userloginFailed, messageForLoginToAddToCart, buyNowLogin})
})

router.post('/login', (req, res, next) => {
  userHelpers.validateLogin(req.body).then((response) => {
    if(response.status){
      req.session.user = response.data;
      req.flash('userloginSuccessfull',`Hi ${response.data.username}. Welcome back !`)
      res.redirect('/')
    }else{
      req.flash('userloginFailed', `Mobile number or password is invalid`)
      res.redirect('/login/')
    }
  })
});

router.get('/profile/', userLogger,(req, res) => {
  res.render('user/user-profile.hbs', {user:true, userSession:req.session.user})
})

router.post('/update-profile/', userLogger,(req, res) => {
  let userID = req.session.user._id
  userHelpers.updateProfile(userID, req.body).then(response => {
    req.session.user = response
    res.redirect('/profile/')
  })
});

router.get('/cart', userLogger, async(req, res) => {
    let cartProducts = await userHelpers.getCartProducts(req.session.user._id)
    let cartTotal = await userHelpers.getCartTotal(req.session.user._id)
    let userDetails = await userHelpers.getUserDetails(req.session.user._id)
      res.render('user/user-cart.hbs', {user:true, userDetails, userSession:req.session.user, cartProducts, cartTotal, cartCount:req.session.user.Count})
});

router.get('/add-to-cart/:id',userLogger, (req, res) => {
    let userID = req.session.user._id;
    let productID = req.params.id;
    userHelpers.addToCart(userID, productID).then(response => {
      //res.json({"status":"true"})
      res.redirect('/cart')
    })
});

router.get('/delete-cart-product/:id', userLogger, (req, res) => {
  userHelpers.deleteCartProduct(req.params.id, req.session.user._id).then(response => {
    if(response){
      res.redirect('/cart')
    }else{
      req.flash('cartIsEmpty', `Cart is empty`)
      res.redirect('/')
    }
  })
});


router.get('/search-by-brand/:id', async(req, res) => {
  let products =await userHelpers.getProductsByBrand(req.params.id)
  res.render('user/sorted-products.hbs', {products, user:true})
})

router.get('/increment-product-quantity/:id', userLogger,(req, res) => {
  userHelpers.incrementProductQuantity(req.session.user._id, req.params.id)
  .then(response => res.json({"status":"true"}))
})

router.get('/decrement-product-quantity/:id', userLogger , (req, res) => {
  userHelpers.decrementProductQuantity(req.session.user._id, req.params.id)
  .then(response => res.json({"status":"true"}))
})

router.get('/checkout/:id', userLogger ,async(req, res) => {
    let cartProducts = await userHelpers.getCartProducts(req.session.user._id)
    let cartTotal = await userHelpers.getCartTotal(req.session.user._id)
    let userDetails = await userHelpers.getUserDetails(req.params.id)
  res.render('user/user-checkout.hbs', {cartProducts, cartTotal, userDetails,user:true, cartCount:req.session.user.Count, userSession:req.session.user})
})

router.post('/place-order/',userLogger, async(req, res) => {
 
    let userDetails = await userHelpers.getUserDetails(req.session.user._id);
    let cartProducts = await userHelpers.getCartProducts(req.session.user._id);
    let cartTotal = await userHelpers.getCartTotal(req.session.user._id);
    paymentMethod =req.body.paymentMethod
    await userHelpers.placeOrder(userDetails, cartProducts, cartTotal, paymentMethod, req.session.user._id)
    .then(response => {
      if(req.body.paymentMethod==='cod'){
        req.flash('orderPlacedSuccessfully', `Hai Your order has been placed successfully ||  You can view your orders in Orders Section`)
        res.redirect('/')
      }else{
        userHelpers.generateRZPOrder(response, cartTotal).then(order => {
          res.render('user/payment-page.hbs', {order, user:true, userSession:req.session.user })
        } ) 
       }
    })
});

router.post('/verify-payment/', (req, res) => {
  let body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;

  var crypto = require("crypto");
  var expectedSignature = crypto.createHmac('sha256', 'Jv6iQQrTUZzTLWCXLeGzvtdR')
                                  .update(body.toString())
                                  .digest('hex');
                                  // console.log("sig received " ,req.body.razorpay_signature);
                                  // console.log("sig generated " ,expectedSignature);
  if(expectedSignature === req.body.razorpay_signature){
    userHelpers.RZPamountReceived(req.session.user.mobileNumber).then(response => {
      res.json({"status":true});
    })
  }else{
    res.json({"status":false})
  }
});

router.get('/payment-successfull/', (req, res) => {
  res.render('user/online-payment-success.hbs', {user:true, userSession:req.session.user})
})

router.get('/payment-failed/', (req, res) => {
  res.render('user/online-payment-failed.hbs', {user:true, userSession:req.session.user})
});

router.get('/categories/:id', (req, res) => {
  userHelpers.getCategory(req.params.id).then( products => {
    res.render('user/user-product-by category.hbs', {products, user:true})
  })
})






router.get('/orders/:id',userLogger, (req, res) => {
  userHelpers.getOrders(req.params.id).then(orders => {
    console.log(orders);
    res.render('user/user-orders.hbs', {orders, userSession:req.session.user, user:true})
  })
})

module.exports = router;

