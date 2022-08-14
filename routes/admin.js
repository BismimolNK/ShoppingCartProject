var express = require('express');
const async = require('hbs/lib/async');
const productHelpers = require('../helpers/product-helpers');
const userHelpers=  require('../helpers/user-helpers');
var router = express.Router();
const { route } = require('./user');

/* GET users listing. */
const verifyAdminLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
  }


router.get('/', function(req, res, next) {
  let Admin=req.session.admin
  if(Admin){
    productHelpers.gatAllProducts().then((products)=>{
      console.log(products)
      res.render('admin/view-products',{Admin, admin:true,products});
    })
  }else{
    res.render('admin/login',{admin:true})
  }
});

router.get('/login',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin')
  }else{
    res.render('admin/login',{admin:true,adminloginErr:req.session.adminLoginErr})
    req.session.adminLoginErr=false
  }  
})
router.post('/login',(req,res)=>{
  productHelpers.adminLogin(req.body).then((response)=>{
    console.log(response);
    if(response.status){
      
      req.session.admin=response.admin
      req.session.adminLoggedIn=true
      res.redirect('/admin')
     
    }else{
      req.session.adminLoginErr='Invalid Email or Password'
      res.redirect('/admin/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.render('admin/login',{admin:true})
})
router.get('/signup',(req,res)=>{
  /*res.render('admin/signup')*/
})

router.post('/signup',(req,res)=>{
productHelpers.adminSignup(req.body).then((response)=>{
    console.log(response);
    req.session.admin=response
    req.session.adminLoggedIn=true
    res.redirect('/admin')
})
})

router.get('/add-product', function(req,res){
  res.render('admin/add-product',{admin:true,Admin:req.session.admin})
})

router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.Image)

 productHelpers.addProduct(req.body,(id)=>{
   let image=req.files.Image
   console.log(id)
     image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
     if(!err){
       res.render('admin/add-product',{admin:true})
      
     }
     else {
       console.log(err)
     }
   })
   
 })

})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId)
  productHelpers.deleteProduct(proId).then(()=>{
   res.redirect('/admin/')
 })
})
 router.get('/edit-product/:id',async (req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
   res.render('admin/edit-product',{product,admin:true,Admin:req.session.admin})
 })
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})
router.get('/all-orders',verifyAdminLogin,(req,res)=>{
  productHelpers.getAllOrders().then((orderDetails)=>{
    res.render('admin/all-orders',{orderDetails,admin:true,Admin:req.session.admin})
  })
})
router.get('/view-order-product/:id',verifyAdminLogin,(async(req,res)=>{
  let orderProducts=await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products',{orderProducts,Admin:req.session.admin,admin:true})
}))
router.get('/all-users',verifyAdminLogin, (req,res)=>{
  productHelpers.getAllUsersList().then((allUsers)=>{

    res.render('admin/all-users',{admin:true,Admin:req.session.admin,allUsers})
  })
})
router.get('/placed-orders',async(req,res)=>{
 await productHelpers.getPlacedOrders().then((orders)=>{
    res.render('admin/placedOrders',{admin:true,Admin:req.session.admin,orders})
  })
})
router.post('/order-shipped',(req,res)=>{
  console.log('This is to change order status');
  console.log(req.body);
  productHelpers.changeStatusPlaced(req.body.orderId).then(()=>{
    res.json({status:true})
  })
})
router.get('/delete-order/:id',((req,res)=>{
  productHelpers.deleteOrder(req.params.id).then(()=>{
    res.redirect('/admin/all-orders')
  })
}))
module.exports = router; 
