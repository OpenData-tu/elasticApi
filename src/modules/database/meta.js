"use strict";

const sources = [
    {
        name: "weather",
        measurement: ["ambienttemperatur", "humidity","precipitation"]
    },
    {
        name: "blume",
        measurement: ["luftpartikel"]
    },
    {
        name: "pegelonlinewterlevel",
        measurement: ["waterlevel"]
    },{
        name: "bfs-uv",
        measurement: ["uv"]
    }
]

/**
 * get all available sources (is a mock right now)
 */
function getSources(){
    return new Promise((resolve, reject) => {
        resolve(sources.map(el => el.name))
    })
}

/**
 * Filters out all indecies, which actually cant hold the requested information
 * @param {String} indicies all indecies which need to be filtered
 * @param {String} startTime the time from which the query starts
 * @param {String} endTime the time until to include the index excluding the time itsself
 */
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

module.exports = {getSources, optimizeTime};