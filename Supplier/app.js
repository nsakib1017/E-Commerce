const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const NodeCouchDb = require('node-couchdb');
const axios = require('axios');
var FormData = require('form-data');
const port = 3001;

app = express()
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
const couch = new NodeCouchDb({
    auth: {
        user: 'admin',
        pass: '1234'
    }
})
app.get('/', function (req, res){
   axios.get('http://localhost:3002/api/company/orders')
  .then(function (response) {
    // handle success
    console.log(response.data);
    res.render('orderlist',{
      orders: response.data
    })
  })
  .catch(function (error) {
    // handle error
    console.log(error);
    res.send("Something went Wrong :( ");
   
  })
})
app.post('/validate/:id',function(req,res){

  orderID=req.params.id;
  amount=req.body.amount;
  sender=req.body.recipient;
  recipient="12sd2";
  
  console.log(orderID, amount, sender, recipient);
  var body ={
    orderID: orderID,
    orderAmount: amount,
    sender: sender,
    recipient: recipient
  }

 // console.log(body)
  axios.post('http://localhost:3002/api/redeem/transaction', 
  {
    orderID: req.params.id,
    orderAmount: req.body.amount,
    sender: req.body.recipient,
    recipient: "12sd2",
    id: req.body.id,
    rev: req.body.rev
  })
  .then(function (response) {
    console.log(response.data);
   // global.orderID=response.data.orderID
    res.redirect('/notifyadmin')
  })
  .catch(function (error) {
   console.log(error);
  });
});

app.get('/notifyadmin',function(req,res){
  console.log(orderID)
  axios.post('http://localhost:3000/api/complete', {orderID: orderID})
  .then(function (response) {
    //res.send(response.data)
    res.redirect('/')
  })
  .catch(function (error) {
   console.log(error);
  });
  //res.redirect("/")
});
app.listen(port, () => console.log(`Server started on port ${port}!`))