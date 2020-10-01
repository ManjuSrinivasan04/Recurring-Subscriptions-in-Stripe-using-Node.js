const express = require('express');
const bodyParser = require('body-parser');
const nunjucks = require('nunjucks');

/*We will use the body-parser package to parse incoming request bodies as "req.body" in our server-side code.
 We will use nunjucks for templating and passing data into our HTML files. 
 We will use the dotenv package to house Stripe Secret keys. 
Lastly, we will use the stripe package to make Stripe API calls.*/


const app = express();
const port = 3000;
const router = express.Router();

const STRIPE_API = require('./api/stripe-functions.js');


/* Set up Express to serve HTML files using "res.render" with help of Nunjucks */

app.set('view engine', 'html');
app.engine('html', nunjucks.render);
nunjucks.configure('views', { noCache: true });

app.use(express.static(__dirname));
app.use('/styles', express.static('styles'));
app.use(bodyParser());
app.use('/', router);


/*difference: 
A Product is essentially the subscription service you are offering. 
A Product can have many Plans. A Subscription connects a Customer to a Plan. */


/* Place all routes here */
router.get('/', (req, res) => {
  STRIPE_API.getAllProductsAndPlans().then(products => {
    res.render('adminView.html', {products: products});
  });
});


/* Create Product */
router.get('/createProduct', (req, res) => {
  res.render('createProduct.html');
});


router.post('/createProduct', (req, res) => {
  STRIPE_API.createProduct(req.body).then(() => {
    res.render('createProduct.html', { success: true });
  });
});


/* Create Plan */
router.post('/createPlan', (req, res) => {
  res.render('createPlan.html', { 
    productId: req.body.productId, 
    productName: req.body.productName 
  });
});


router.post('/createPlanForReal', (req, res) => {
  STRIPE_API.createPlan(req.body).then(() => {
    res.render('createPlan.html', { success: true });
  });
});

//render our Customer View and pass in the filtered product data
   
router.get('/customerView', (req, res) => {
  STRIPE_API.getAllProductsAndPlans().then(products => {
    products = products.filter(product => {
      return product.plans.length > 0;
    });

    res.render('customerView.html', {products: products});
  });
});

//take the submitted product and plan data and pass it to a plan-specific sign up page

router.post('/signUp', (req, res) => {
  var product = {
    name: req.body.productName
  };

  var plan = {
    id: req.body.planId,
    name: req.body.planName,
    amount: req.body.planAmount,
    interval: req.body.planInterval,
    interval_count: req.body.planIntervalCount
  }

  res.render('signUp.html', {product: product, plan: plan});
});


router.post('/processPayment', (req, res) => {
  var product = {
    name: req.body.productName
  };

  var plan = {
    id: req.body.planId,
    name: req.body.planName,
    amount: req.body.planAmount,
    interval: req.body.planInterval,
    interval_count: req.body.planIntervalCount
  }

  STRIPE_API.createCustomerAndSubscription(req.body).then(() => {
    res.render('signup.html', {product: product, plan: plan, success: true});
  }).catch(err => {
    res.render('signup.html', {product: product, plan: plan, error: true});
  });
});



/* Listening on port */
app.listen(port, () => {
  console.info('App listening on port', port)
});

