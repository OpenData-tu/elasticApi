"use strict"; 

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
    host: '127.0.0.1:9200',
    log: 'warning'
});

const bulkIndex = function bulkIndex(index, type, data) {
    let bulkBody = [];

    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id
            }
        });

        bulkBody.push(item);
    });

    esClient.bulk({body: bulkBody})
        .then(res => {
            let errorCount = 0;
            res.items.forEach(item => {
                if (item.index && item.index.error){
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log('Successfully indexed ${data.length - errorCount} out of ${data.length} items!');
        })
        .catch(console.err);
};

const datePlus = function datePlus(plus) {
    let dat = new Date();
    dat.setHours(dat.getHours() + plus);
    return dat;
}

const bulkIndexGen = function bulkIndexGen(index, type, count) {
    let data = [];
    let bulkBody = [];

    let dat = new Date();
    dat.setHours(dat.getHours() + 10);
    console.log((datePlus(2).toISOString()));
    


    for(let i=0;i<count;i++){
        data.push({
                    "source_id": "luftdaten_info",
                    "device": "141",
                    "timestamp": datePlus(i).toISOString(),
                    "location": {
                        "lat": 48.779,
                        "lon": 9.16
                    },
                    "license": "find out",
                    "sensors": {
                        "pressure": {
                            "sensor": "BME280",
                            "observation_value": 97740.48
                        },
                        "altitude": {
                            "sensor": "BME280",
                            "observation_value": null
                        },
                        "pressure_seallevel": {
                            "sensor": "BME280",
                            "observation_value": null
                        },
                        "temperature": {
                            "sensor": "BME280",
                            "observation_value": ((Math.sin((Math.PI / (count*1.35)) * i) + 1) * 10 +  10 + ((Math.sin((Math.PI / 180) * i) + 1) / 4) + Math.random()*0.25).toFixed(8)
                        },
                        "humidity": {
                            "sensor": "BME280",
                            "observation_value": 76.34
                        }
                    },
                    "extra": {
                        "location": "65"
                    }
                });

    }  

    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id
            }
        });

        bulkBody.push(item);
    });

    esClient.bulk({body: bulkBody})
        .then(res => {
            let errorCount = 0;
            res.items.forEach(item => {
                if (item.index && item.index.error){
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log('Successfully indexed ${data.length - errorCount} out of ${data.length} items!');
        })
        .catch(console.err);
      
};

module.exports = {bulkIndex, bulkIndexGen};