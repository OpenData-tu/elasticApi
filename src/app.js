"use strict";

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const elasticSearch = require('elasticsearch');

let host = process.env.ESHOST || '127.0.0.1:9200';

const routeSearch = require('./modules/routes/search')


const bulkIndex = require('./modules/bulkIndex');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const port = process.env.PORT || 8080;
const router = express.Router();

// CREATE ROUTING FOR THE API
router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next(); // make sure we go to the next routes and don't stop here
});


app.route('/').get( function (req, res) {
    // TODO index.html
    let answer = '<h1>Elasticsearch API is running</h1>' +
        '<p>API Endpoints:</p>' +
        '<ul><li>/api/sources</li>' +
        '<li>/api/sources/<i>sourceName</i></li>' +
        '<li>/api/measurements/<i>measurementType</i></i></li>' +
        '<p>For all available endpoint parameters, please read the documentation</p>';        
    res.send(answer);
});

router.route('/test')

    // Filled the DB with testdata, please do not use in production
    .get(function (req, res) {
        bulkIndex.bulkIndexGen("data-weather-2017", "data", 100000);
        res.end();

        //return JSON.        
    });


// REGISTER ALL ROUTES
// all of our routes will be prefixed with /api
app.use('/api', routeSearch);
app.use('/helper', router);

app.listen(port);
console.log('Server running on port ' + port);