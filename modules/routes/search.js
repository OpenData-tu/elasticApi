"use strict"; 
const express = require('express');

const router = express.Router();
const ELASTIC = require('../database/elastic');

const db = new ELASTIC();

router.get('/indices/:indexName/bucket/:time/agr/:type', (req, res) => {
    db._search(req, res);
})


module.exports = router;