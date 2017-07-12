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
    
    if(req.query['location']){
        req.query['location'] = req.query['location'].split(",");
    }
    console.log("Parsed Location")
    next(); // make sure we go to the next routes and don't stop here
});

// Parse time data
routerSearch.use(function (req, res, next) {
    
    if(req.query['time']){
        req.query['time'] = req.query['time'].split(",");
    }
    console.log("Parsed Time")
    next(); // make sure we go to the next routes and don't stop here
});

routerSearch.get('/', (req, res) => {
    console.log("test");
    res.end();
});

routerSearch.get('/sources/:indexName/bucket/:time/agr/:type', (req, res) => {
    META.getSources().then(result => {
        if(result.includes(req.params.indexName)){
            db._search(req).then((result)=> res.json(result));
        }else{
            res.json({error: "no such source"})
        }
    })
    
});

routerSearch.get('/sources', (req, res) => {    
    META.getSources().then(result => {
        res.json(result);
    });
});




module.exports = routerSearch;