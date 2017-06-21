"use strict";

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const elasticSearch = require('elasticsearch');

let host = process.env.ESHOST || '127.0.0.1:9200';

const esClient = new elasticSearch.Client({
    host: host,
    log: 'error'
});

esClient.ping({
    requestTimeout: 30000,
}, function (error) {
    if (error) {
        console.error('Elasticsearch cluster is down!');
    } else {
        console.log('ElasticSearch running at ' + host);
    }
});

// const bulkIndex = require('./modules/bulkIndex');
// const searchIndex = require('./modules/searchAll');
const stdMethods = require('./modules/stdMethods');

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 8080;
const router = express.Router();

// CREATE ROUTING FOR THE API
router.use(function (req, res, next) {
    next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function (req, res) {
    // TODO index.html
    let answer = '<h1>Elasticsearch API is running</h1>' +
        '<p>Possible API calls:</p>' +
        '<ul><li>/api/indices</li>' +
        '<li>/api/indices/<i>indexName</i></li>' +
        '<li>/api/indices/<i>indexName</i>/docs/<i>docId</i></li>' +
        '<li>/api/indices/<i>indexName</i>/suggest/<i>input</i></li></ul>'
    res.send(answer);
});

router.route('/indices')

// Show all indexes
    .get(function (req, res) {
        esClient.cat.indices({
            format: 'json'
        })
            .then(function (result) {
                // let jsonObj = JSON.parse(JSON.stringify(result).replace('[', '').replace(']', ''));
                let resultString = JSON.stringify(result).substring(1, JSON.stringify(result).length-1);
                res.render(result);
            })
            .catch(err => console.error(`Error connecting to the es client: ${err}`));
    });



router.route('/indices/:indexName')

// Do something!
    .get(function (req, res) {
        //console.log('Looking for index ' + req.params.indexName);
        //esClient.indices.get(req.params.indexName)
        stdMethods.existIndex(req.params.indexName)
            .then(function (result) {
                res.json(result);
            })
            .catch(err => console.error(`Error connecting to the es client: ${err}`));
    });


// router.route('/indices/:indexName/all')
//
//     .get(function(req, res) {
//        esClient.search({
//             index: req.params.indexName,
//             q: '_id: 24'
//             // body: {
//             //     query: {
//             //         match: {
//             //             _id: '24'
//             //         }
//             //     }
//             // }
//         })
//             .then(function(result) {
//                 res.json(result);
//             })
//             .catch(err => console.error(`Error connecting to the es client: ${err}`));
//     });

router.route('/indices/:indexName/all')

    .get(function(req, res) {
       esClient.search({
            index: req.params.indexName,
            q: '_id: 24'
            // body: {
            //     query: {
            //         match: {
            //             _id: '24'
            //         }
            //     }
            // }
        }, function(error, result) {
                console.log(error);
                console.log(result);
            }
       )
    });

router.route('/indices/:indexName/docs/:docId')

// Check for doc with given Id, if exists in given index!
    .get(function (req, res) {
        //console.log('Looking for index ' + req.params.indexName);
        //esClient.indices.get(req.params.indexName)
        esClient.exists({
            index: req.params.indexName,
            type: '_all',
            id: req.params.docId
        })
            .then(function (result) {
                res.json(result);
            })
            .catch(err => console.error(`Error connecting to the es client: ${err}`));
    });

router.route('/indices/:indexName/suggest/:input')

    // Get suggestions
    .get(function(req, res){
        esClient.suggest({
            index: req.params.indexName,
            type: '_all',
            body: {
                docsuggest: {
                    text: req.params.input,
                    completion: {
                        field: 'suggest',
                        fuzzy: true
                    }
                }
            }
        })
            .then(function(result){
                res.json(result);
            })
            .catch(err => console.error('Error connecting to the es client: ${err}'));
    });




// REGISTER ALL ROUTES
// all of our routes will be prefixed with /api
app.use('/api', router);


app.listen(port);
console.log('Server running on port ' + port);