"use strict"; 

const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
    host: '127.0.0.1:9200',
    log: 'warning'
});

/**
 * just a time creation function which addes hours to the current time
 * @param {int} plus 
 */
const datePlus = function datePlus(plus) {
    let dat = new Date();
    dat.setHours(dat.getHours() + plus);
    return dat;
}

/**
 * Function which creates fake data for 5 different locations in germany and partly random temperatures with some sinus
 * @param {*} index name of the index to enter the data into
 * @param {*} type type name (usually data)
 * @param {*} count number of entries
 */
const bulkIndexGen = function bulkIndexGen(index, type, count) {
    let data = [];
    let bulkBody = [];

    let locations = [{
        "lat": 52.5239,
        "lon": 13.4573
    },{        
        "lat": 55.0239,
        "lon": 12.7573
    },{
        "lat": 48.8539,
        "lon": 10.4673
    },{
        "lat": 49.3539,
        "lon": 8.1296
    },{
        "lat": 53.03539,
        "lon": 8.7696
    }];
    let dat = new Date();
    dat.setHours(dat.getHours() + 10);
    console.log((datePlus(2).toISOString()));
    

    let bucket = count/locations.length;

    for(let i=0;i<count;i++){        
        data.push({
                    "source_id": "luftdaten_info",
                    "device": "141",
                    "timestamp": datePlus(i).toISOString(),
                    "location": locations[Math.floor(i/bucket)],
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
                            "observation_value": Number.parseFloat(((Math.sin((Math.PI / (count*1.35)) * i) + 1) * 10 +  10 + ((Math.sin((Math.PI / 180) * i) + 1) / 4) + Math.random()*0.25).toFixed(4))
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
            console.log('Successfully indexed %d out of %d items!', bulkBody.length - errorCount,bulkBody.length);
        })
        .catch(console.err);
      
};

module.exports = {bulkIndexGen};