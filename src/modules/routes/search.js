"use strict";
const express = require('express');

const routerSearch = express.Router();
const ELASTIC = require('../database/elastic');
const META = require('../database/meta');

const db = new ELASTIC();

// CREATE ROUTING FOR THE API
routerSearch.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next(); // make sure we go to the next routes and don't stop here
});

// Parse location data
routerSearch.use(function (req, res, next) {

    if (req.query['location']) {
        req.query['location'] = req.query['location'].split(",");
    }
    console.log("Parsed Location")
    next(); // make sure we go to the next routes and don't stop here
});

// Parse time data
routerSearch.use(function (req, res, next) {

    if (req.query['time']) {
        req.query['time'] = req.query['time'].split(",");
    }
    console.log("Parsed Time")
    next(); // make sure we go to the next routes and don't stop here
});

// Parse time data
routerSearch.use(function (req, res, next) {

    // all allowed aggregations
    let aggs = ["sum", "avg"];

    if (req.query['agg']) {
        if (!aggs.includes(req.query['agg']))
            req.query['agg'] = undefined;
    }
    console.log("Parsed aggregations")
    next(); // make sure we go to the next routes and don't stop here
});

// Parse time data
routerSearch.use(function (req, res, next) {

    // TODO: saftycheck here
    console.log("Parsed bucket")
    next(); // make sure we go to the next routes and don't stop here
});

routerSearch.get('/', (req, res) => {
    console.log("test");

    let d = new Date("2017-05-22");
    //console.log(d.getUTCFullYear());
    db.getIndices("data").then(result => {
        res.json(optimizeTime(result.map(elem => elem.index), "2016", "2017-07-02"));
        //res.json(result);
    });
    //res.end();
});

function optimizeTime(indicies, startTime, endTime) {
    let start = new Date(startTime);
    let end = new Date(endTime);
    end = end - 1;

    return indicies.filter(item => {
        let indexOfTime = item.indexOf('-', 5);
        if (indexOfTime == -1) return true;
        else {
            let indexDate = new Date(item.substr(indexOfTime + 1));
            return indexDate >= start && indexDate <= end ? true : false;
        }
    });


}

// routerSearch.get('/sources/:indexName/bucket/:time/agr/:type', (req, res) => {
routerSearch.get('/sources/:indexName', (req, res) => {
    /*
    META.getSources().then(result => {
        if(result.includes(req.params.indexName)){
            db._search(req).then((result)=> res.json(result));
        }else{
            res.json({error: "no such source"})
        }
    })
    */
    db.getIndices(req.params.indexName).then(result => {
        if (req.query["time"])
            req.params.indexName = optimizeTime(result.map(elem => elem.index), req.query["time"][0], req.query["time"][1]);
        else {
            req.params.indexName = result.map(item => item.index);
        }
        if (req.query['agg']) {
            if (!req.query.mess) {
                res.json({
                    "error": "Aggregations need a messurement. Please supply messurement in query via 'mess=<messurement>'"
                });
                return;
            }
            db._searchAgg(req).then((result) => res.json(result));
        } else
            db._search(req).then((result) => res.json(result));
    });


    //req.params.
    //db._search(req).then((result)=> res.json(result));

});

routerSearch.get('/measurements/:measurements', (req, res) => {
    // TODO: filter indicies by Messurment
    db.getIndicesByMessurement().then(result => {
        if (req.query["time"])
            req.params.indexName = optimizeTime(result.map(elem => elem.index), req.query["time"][0], req.query["time"][1]);
        req.query['includes'] = ["location", "license", "timestamp", "device", "source_id", "extra"]
        
        req.query.includes.push("sensors." + req.params.measurements + ".*");

        req.query['mess'] = req.params.measurements;

        if (req.query['agg']) {
            if (!req.query.mess) {
                res.json({
                    "error": "Aggregations need a messurement. Please supply messurement in query via 'mess=<messurement>'"
                });
                return;
            }
            db._searchAgg(req).then((result) => res.json(result));
        } else
            db._search(req).then((result) => res.json(result));
    });

});

routerSearch.get('/sources', (req, res) => {
    META.getSources().then(result => {
        res.json(result);
    });
});




module.exports = routerSearch;