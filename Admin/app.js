const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const axios=require('axios')
const NodeCouchDb = require('node-couchdb');
const port = 3000
global.Adminacc = "12sd1";
const generateStrings = (numberOfStrings, stringLength) => {
    const randomstring = require('randomstring')
    const s = new Set()

    while (s.size < numberOfStrings) {
        s.add(randomstring.generate(stringLength))
    }
    return s
}
app = express()
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const couch = new NodeCouchDb({
    auth: {
        user: 'admin',
        pass: '1234'
    }
});

const dbName = 'company'
const viewURL = '_design/carts/_view/cartID'
viewURL2 = '_design/products/_view/viewProducts'
couch.listDatabases().then(function (dbs) {

});
app.get('/', function (req, res) {
    res.render("landingpage");
})
app.post('/login', function (req, res) {
    const uname = req.body.uname;
    const upass = req.body.upass;
    const mangoQuery = {
        selector: {
            "uname": { "$eq": uname },
            "upass": { "$eq": upass }
        }
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        global.x = data.docs
        //  console.log(global.x)
        res.redirect('/shop')
    }, err => {
        res.send(err)
    })
})
app.get('/register', function (req, res) {
    res.render("registration");
})
app.post('/home', function (req, res) {
    uname = req.body.uname;
    upass = req.body.upass;
    couch.get(dbName, viewURL2).then(function (data, headers, status) {
        console.log(data.data.rows);
        res.render('shop2', {
            products: data.data.rows,
            uname: req.body.uname,
            upass: req.body.upass
        })
    }, function (err) {
        res.send(err);
    })
})
app.post('/createuser', function (req, res) {
    const uname = req.body.uname
    const upass = req.body.upass
    const acc = req.body.acc
    const strings = generateStrings(1, 20)
    global.uid = "This is an ID"
    for (const value of strings.values()) {
        global.uid = value
    }
    uid = global.uid
    //res.send({uname,upass,acc,uid});
    couch.uniqid().then(function (ids) {
        const id = ids[0];
        couch.insert(dbName, {
            _id: id,
            uid: uid,
            uname: uname,
            upass: upass,
            acc: acc
        }).then(function (data, headers, status) {
            const mangoQuery = {
                selector: {
                    "uname": { "$eq": uname },
                    "upass": { "$eq": upass }
                }
            }
            couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
                global.x = data.docs
                // console.log(global.x)
                res.redirect('/shop')
            }, err => {
                res.send(err)
            })
        }, function (err) {
            res.send(err)
        })
    })
});
app.get('/shop', function (req, res) {
    //console.log(global.x)
    couch.get(dbName, viewURL2).then(function (data, headers, status) {
        //console.log(data.data.rows);
        for (var key in global.x) {
            global.uid = global.x[key].uid
            global.acc = global.x[key].acc
            global.uname = global.x[key].uname
        }
        if (uid != null) {
            res.render('shop', {
                products: data.data.rows,
                uid: global.uid,
                uname: global.uname,
                acc: global.acc
            })
        }
    }), function (err) {
        res.send(err);
    }
});
app.post('/shop/buy', function (req, res) {
    hoodie = Number(req.body.hoodie);
    sneakers = Number(req.body.sneaker);
    fitbit = Number(req.body.fitbit);
    amount = 10000 * hoodie + 1500 * sneakers + 10000 * fitbit;
    acc = global.acc
    const strings = generateStrings(1, 20)
    global.orderID = "This is an ID"
    for (const value of strings.values()) {
        global.orderID = value
    }
   console.log(global.orderID)
    axios.post('http://localhost:3002/api/buy/transaction', 
    {
      orderID: global.orderID,
      orderAmount: amount,
      sender: acc,
      recipient: global.Adminacc,
      hoodie: hoodie,
      sneakers: sneakers,
      fitbit: fitbit
    })
    .then(function (response) {
    //  console.log(response.data);
      //create record
      //res.send({re: response.data.orderID, uid:global.uid})
      couch.uniqid().then(function (ids) {
        const id = ids[0]
        couch.insert(dbName, {
            _id: id,
            orderID: global.orderID,
            uid: global.uid
        }).then(function (data, headers, status) {
            res.redirect('/shop')
        }, function (err) {
            res.send(err)
        }) 
    })
    })
    .catch(function (error) {
    //  console.log(error);
    });
});
app.post('/api/complete',function(req,res){
    //console.log(req.body.orderID)
    const mangoQuery = {
        selector: {
           "orderID": {"$eq" : req.body.orderID}
        }
    }
    couch.mango(dbName, mangoQuery).then(({data, headers, status}) => {
      for(var x in data.docs){
      // console.log(data.docs[x].orderID)
       global.id=data.docs[x]._id;
       global.rev=data.docs[x]._rev
      }
       console.log(id,rev)
    }, err => {
        res.send(err)
    });
    couch.del(dbName, id, rev).then(function (data, headers, status) {
       console.log('deleted')
    }, function (err) {
        res.send(err)
    })

    couch.uniqid().then(function (ids) {
        const id = ids[0]
        couch.insert(dbName, {
            _id: id,
            uid: global.uid,
            orderID: global.orderID,
            message: "Order Supplied for orderID "+ global.orderID
        }).then(function (data, headers, status) {
            
        }, function (err) {
            res.send(err)
        })
    })
   res.send({messeage: "Done"})
})
app.get('/messages',function(req,res){
    const mangoQuery = {
        selector: {
            "orderID": {"$eq": global.orderID}
          },
          fields: [
            "message"
          ]
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        //global.x = data.docs
         //console.log(global.x)
        for(var x in data.docs){
            if(data.docs[x].message!= null ){
                res.send(data.docs[x].message)
            }
        }
       
    }, err => {
        res.send(err)
    })
})
app.listen(port, () => console.log(`Server started on port ${port}!`))