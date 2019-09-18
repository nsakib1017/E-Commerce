const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs');
const NodeCouchDb = require('node-couchdb')
const port = 3002
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
app.use(bodyParser.urlencoded({ extended: true }))
const couch = new NodeCouchDb({
    auth: {
        user: 'admin',
        pass: '1234'
    }
})
const dbName = 'bank'
const viewURL = '_design/allAccounts/_view/accounts'
const viewURL2 = '_design/orderID/_view/orderID'
couch.listDatabases().then(function (dbs) {
    //  console.log(dbs)
})

app.get('/', function (req, res) {
    couch.get(dbName, viewURL).then(function (data, headers, status) {
        //    console.log(data.data.rows)
        res.render('index', {
            accounts: data.data.rows
        })
    }, function (err) {
        res.send(err)
    })
})
app.get('/api/allaccount', function (req, res) {
    couch.get(dbName, viewURL).then(function (data, headers, status) {
        //    console.log(data.data.rows)
        res.send(data.data.rows)
    }, function (err) {
        res.send(err)
    })
})
app.post('/account/add', function (req, res) {
    var acc = req.body.account
    var amount = req.body.amount
    couch.uniqid().then(function (ids) {
        const id = ids[0]
        couch.insert(dbName, {
            _id: id,
            acc: acc,
            amount: amount
        }).then(function (data, headers, status) {
            res.redirect('/')
        }, function (err) {
            res.send(err)
        })
    })
})

app.post('/account/delete/:id', function (req, res) {
    const id = req.params.id
    const rev = req.body.rev
    couch.del(dbName, id, rev).then(function (data, headers, status) {
        res.redirect('/')
    }, function (err) {
        res.send(err)
    })
})

app.post('/account/update/:id', function (req, res) {
    const id = req.params.id
    const rev = req.body.rev
    const mangoQuery = {
        selector: {
            "_id": { "$eq": id },
            "_rev": { "$eq": rev }
        }
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        var x = data.docs
        //  console.log(x)
        res.render('update', {
            target: x
        })
    }, err => {
        res.send(err)
    })
})

app.post('/', function (req, res) {
    const id = req.body.id
    const rev = req.body.rev
    const acc = req.body.account
    const amount = Number(req.body.amount)
    couch.update(dbName, {
        _id: id,
        _rev: rev,
        acc: acc,
        amount: amount
    }).then(function (data, headers, status) {
        couch.get(dbName, viewURL).then(function (data, headers, status) {
            // console.log(data.data.rows)
            res.render('index', {
                accounts: data.data.rows
            })
        }, function (err) {
            res.send(err)
        })
    }, function (err) {
        res.send(err)
    })
})
app.post('/account/view',function(req,res){
    const acc = req.body.account;
    const mangoQuery = {
        selector: {
            "acc": { "$eq": acc }
        }
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        var inf = data.docs
          console.log(data.docs)
        res.render('balance',{
            target: inf
        });
    }, err => {
        res.send(err)
    })
})
app.post('/account/transaction', function (req, res) {
    const acc1 = req.body.account1
    const acc2 = req.body.account2
    const trans = Number(req.body.amount)
    //  console.log(acc1, acc2, trans)
    const mangoQuery = {
        selector: {
            "$or": [
                { "acc": acc1 },
                { "acc": acc2 }
            ]
        }
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        var x = data.docs

        for (var item in x) {

            y = y + 1
            const id = x[item]._id
            const rev = x[item]._rev
            const acc = x[item].acc
            var amount = Number(x[item].amount)
            if (acc == acc1)
                amount = amount - trans;
            else {
                amount = amount + trans;
            }
            //console.log(id, rev, acc, amount)
            couch.update(dbName, {
                _id: id,
                _rev: rev,
                acc: acc,
                amount: amount
            }).then(function (data, headers, status) {
                couch.get(dbName, viewURL).then(function (data, headers, status) {
                    console.log(data.data.rows)
                    res.redirect('/')
                }, function (err) {
                    res.send(err)
                })
            }, function (err) {
                res.send(err)
            })

        }
    }, err => {
        res.send(err)
    })
});

app.post('/api/redeem/transaction', function (req, res) {

    acc1 = req.body.sender;
    acc2 = req.body.recipient;
    trans = Number(req.body.orderAmount);
    console.log(req.body);
    console.log(acc1, acc2, trans)
    const mangoQuery = {
        selector: {
            "$or": [
                { "acc": acc1 },
                { "acc": acc2 }
            ]
        }
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        var x = data.docs
        var y = 0
        for (var item in x) {
            const id = x[item]._id
            const rev = x[item]._rev
            const acc = x[item].acc
            var amount = Number(x[item].amount)
            if (acc == acc1)
                amount = amount - trans
            else {
                amount = amount + trans
            }
            //console.log(id, rev, acc, amount)
            couch.update(dbName, {
                _id: id,
                _rev: rev,
                acc: acc,
                amount: amount
            }).then(function (data, headers, status) {
            }, function (err) {
                
            })
        }
        couch.get(dbName, viewURL).then(function (data, headers, status) {
            //  console.log(data.data.rows)
              couch.del(dbName, req.body.id, req.body.rev)
              .then(function (data, headers, status) {
                 // console.log("asudhuh")
              res.send({ message: "Transaction complete",orderID: req.body.orderID });
              }, function (err) {
                  res.send(err)
              })
          }, function (err) {
              res.send(err)
          })
    }, err => {
        res.send(err)
    })
})
app.get('/company/orders', function (req, res) {
    couch.get(dbName, viewURL2).then(function (data, headers, status) {
        // console.log(data.data.rows)
        res.render('orders', {
            orders: data.data.rows
        })
    }, function (err) {
        res.send(err)
    })
})
app.get('/api/company/orders', function (req, res) {
    couch.get(dbName, viewURL2).then(function (data, headers, status) {
        // console.log(data.data.rows)
        res.send(data.data.rows)
    }, function (err) {
        res.send(err)
    })
})
app.post('/api/buy/transaction', function (req, res) {
    const acc1 = req.body.sender
    const acc2 = req.body.recipient
    const trans = Number(req.body.orderAmount)
    //  console.log(acc1, acc2, trans)
    const mangoQuery = {
        selector: {
            "$or": [
                { "acc": acc1 },
                { "acc": acc2 }
            ]
        }
    }
    couch.mango(dbName, mangoQuery).then(({ data, headers, status }) => {
        var x = data.docs
        for (var item in x) {

            const id = x[item]._id
            const rev = x[item]._rev
            const acc = x[item].acc
            var amount = Number(x[item].amount)
            if (acc == acc1)
                amount = amount - trans
            else {
                amount = amount + trans
            }
            //console.log(id, rev, acc, amount)
            couch.update(dbName, {
                _id: id,
                _rev: rev,
                acc: acc,
                amount: amount
            }).then(function (data, headers, status) {
                couch.get(dbName, viewURL).then(function (data, headers, status) {
                    //console.log(data.data.rows)
                }, function (err) {
                    res.send(err)
                })
            }, function (err) {
                res.send(err)
            })
        }
        orderID = req.body.orderID
       // console.log(orderID)
        couch.uniqid().then(function (ids) {
            const id = ids[0]
            couch.insert(dbName, {
                _id: id,
                orderID: orderID,
                orderAmount: trans,
                sender: acc1,
                recipient: acc2,
                hoodie: req.body.hoodie,
                sneakers:req.body.sneakers,
                fitbit: req.body.fitbit
            }).then(function (data, headers, status) {
                res.send({ orderID: orderID })
            }, function (err) {
                res.send(err)
            })
        })
    }, err => {
        res.send(err)
    })

    // res.send({acc1: acc1,acc2: acc2,trans: trans});
})
app.listen(port, () => console.log(`Server started on port ${port}!`))