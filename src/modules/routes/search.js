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

// Parse aggregation type data
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

/**
 * sources endpoint with the sourcename/indexname as query parameter
 */
routerSearch.get('/sources/:indexName', (req, res) => {
    /*
    TODO for querying the management db
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
            req.params.indexName = META.optimizeTime(result.map(elem => elem.index), req.query["time"][0], req.query["time"][1]);
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
});

/**
 * measurements endpoint with the measurement type as query parameter
 */
routerSearch.get('/measurements/:measurements', (req, res) => {
    // TODO: filter indicies by Messurment
    db.getIndicesByMessurement().then(result => {
        if (req.query["time"])
            req.params.indexName = META.optimizeTime(result.map(elem => elem.index), req.query["time"][0], req.query["time"][1]);
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
    db.getSources().then(result => {
        res.json(result);
    });
});

module.exports = routerSearch;