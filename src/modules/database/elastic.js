"use strict";
const elasticSearch = require('elasticsearch');
let host = process.env.ESHOST || '127.0.0.1:9200';

module.exports = class ELASTIC {
    constructor() {
        this.esClient = new elasticSearch.Client({
            host: host,
            log: 'error'
        });

        this.esClient.ping({
            requestTimeout: 30000,
        }, function (error) {
            if (error) {
                console.error('Elasticsearch cluster is down!');
            } else {
                console.log('ElasticSearch running at ' + host);
            }
        });
    }

    _search(req, res) {

        let timeGte = "new-1h/m"
        let timeLte = "new/m"
        if (req.query["time"] && req.query["time"].length === 2) {
            timeGte = req.query["time"][0];
            timeLte = req.query["time"][1];

        }
        let jsonVar = {
            index: req.params.indexName,
            size: 0,
            body: {

                "query": {
                    "constant_score": {
                        "filter": {
                            "range": {
                                "timestamp": {
                                    "gte": timeGte,
                                    "lte": timeLte
                                }
                            }
                        }
                    }
                },
                sort: [{
                    "timestamp": {
                        "order": "desc"
                    }
                }],
                "aggs": {
                    "agg_per_time": {
                        "date_histogram": {
                            "field": "timestamp",
                            "interval": req.params.time
                        },
                        "aggs": {
                            "type": {
                                [req.params.type]: {
                                    "field": "sensors.temperature.observation_value"
                                }
                            }
                        }
                    }
                }

            },

        }

        if (req.query["location"] && req.query["location"].length === 4) {
            if (!jsonVar.body.query.constant_score.filter["bool"]) {
                let range = jsonVar.body.query.constant_score.filter;
                jsonVar.body.query.constant_score.filter = {
                    "bool": {
                        "must": []
                    }
                }
                jsonVar.body.query.constant_score.filter.bool.must.push(range);
            }
            jsonVar.body.query.constant_score.filter.bool.must.push({
                "geo_bounding_box": {
                    "location": {
                        "top_left": {
                            "lat": req.query["location"][0],
                            "lon": req.query["location"][1],
                        },
                        "bottom_right": {
                            "lat": req.query["location"][2],
                            "lon": req.query["location"][3],
                        }
                    }


                }
            });

        }

        console.log(JSON.stringify(jsonVar, null, 2));


        this.esClient.search(jsonVar)
            .then(function (result) {
                res.json(result.aggregations.agg_per_time.buckets.map(d => {
                    return {
                        timestamp: d.key_as_string,
                        value: d.type.value
                    }
                }));
            })

            .catch(err => {
                console.error(`Error connecting to the es client: ${err}`);
                res.send(`Error connecting to the es client: ${err}`);
                

            });
            
    }
}