const { response } = require('express');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers=  require('../helpers/user-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
  }
router.get('/', async function(req, res, next) {
  let user=req.session.user
  console.log(user);
  let cartCount=null
  if(req.session.user){
  cartCount= await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.gatAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount});
  })
});
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{userloginErr:req.session.userLoginErr})
    req.session.userLoginErr=false
  }
    
   
  
})
router.get('/signup',(re,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.user=response
    req.session.userLoggedIn=true
    res.redirect('/')
})
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    console.log(response);
    if(response.status){
      
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect('/')
     
    }else{
      req.session.userLoginErr='Invalid Email or Password'
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})
router.get('/cart',verifyLogin,async (req,res)=>{
  
     userHelpers.checkCartList(req.session.user._id).then(async (response)=>{
       if (response.status){
        let products= await userHelpers.getCartProducts(req.session.user._id) 
        let totalValue= await userHelpers.getTotalAmount(req.session.user._id)
        res.render('user/cart',{products,totalValue,user:req.session.user})
      console.log(products);
       }else{
         res.render('user/cart',{user:req.session.user})
       }
     })
  
  })
  
   
   


router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call');

   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
   })
 
}),
router.post('/change-product-quantity',(req,res)=>{
     userHelpers.changeProductQuantity(req.body).then(async (response)=>{
       response.total=await userHelpers.getTotalAmount(req.body.user)
       res.json(response);
     
      
      })
          
}),
router.post('/remove-cart-product',(req,res)=>{
  userHelpers.removeCartProduct(req.body).then((response)=>{
    res.json(response);
  })
}),
router.get('/place-order',verifyLogin,async (req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/placeOrder',{total,user:req.session.user})
})
router.post('/place-order',async (req,res)=>{
  let cartProducts= await userHelpers.getCartProductList(req.body.userId)
  let total=await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,total,cartProducts).then((orderId)=>{
    if(orderId.codSuccess==='COD'){
      res.json({codSuccess:true})
    }else{
      userHelpers.generateRazorpay(orderId.insertedId,total).then((response)=>{  
      res.json(response)
      })
    }
   
  })
 
})
router.get('/order-conformation',(req,res)=>{
  res.render('user/orderConformation',{user:req.session.user})
})
router.get('/orders',async (req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{orders,user:req.session.user})
})
router.get("/view-order-product/:id",async (req,res)=>{
  let orderProducts=await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,orderProducts})
})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:'Payment Failed'})
  })
})

module.exports = router;
