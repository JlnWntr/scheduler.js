/*
* Copyright (c) 2019-2022 JlnWntr (jlnwntr@gmail.com)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
const hostname      = "127.0.0.1"
const port          = 3000

const DEFAULT_SCHEDULER_TIMEOUT = 60000
const DEFAULT_CORS_MODE = "cors" // no-cors, cors, *same-origin
const DEFAULT_CACHE = "no-cache" // *default, no-cache, reload, force-cache, only-if-cached

const SCHEDULER_JOB_STATUS_RUNNING = "running"
const SCHEDULER_JOB_STATUS_DONE = "done"

const http          = require("http")
const https         = require("https")
const url           = require('url')

var sch               = new Scheduler()
var data              = {}

function Scheduler(timeout) {
    this.running = false    
    this.queue = []
    this.timeout = timeout
    if (this.timeout == undefined) this.timeout = DEFAULT_SCHEDULER_TIMEOUT
}

Scheduler.prototype.add = function (destination, path, callback, request) {  
    //const headers =  JSON.stringify(request.headers)   
    var r =  {
        method: request.method,
        mode: DEFAULT_CORS_MODE,
        cache: DEFAULT_CACHE,
        timeout: this.timeout,        
        hostname: destination,
        port: 443,
        path: path,        
        headers: {"user-agent": "Mozilla"}//headers["user-agent"]}
        //JSON.stringify(request.headers)
    }
    //if (body != undefined) r.body = body
    
    this.queue.push({
        "request": r,
        "callback": callback,
        "status": SCHEDULER_JOB_STATUS_RUNNING
    });
    if (this.running == false) this.work()
}

Scheduler.prototype.work = function () {
    if (this.running == true) return true
    this.running = true

    var new_job = this.queue.shift()
    if (new_job == undefined) {
        this.running = false
        return false
    }
    new_job.status = SCHEDULER_JOB_STATUS_RUNNING
    
    const req = https.request(new_job.request, function (job, that, res){            
        res.on("data", function(callback, json){
          if (callback !== undefined) 
            callback(json.toString())//JSON.stringify(json))
        }.bind(null, job.callback))
        
        that.running = false
        job.status = SCHEDULER_JOB_STATUS_DONE
        that.work()
      }.bind(null, new_job, this)
    )  
    req.on("error", error => {
        console.error(error)
    })      
    //req.write(data)
    req.end()
    return true
}

function write(key, data){
    if (data[key] === undefined)
        data[key] = new Array()
    console.log(data[key])
    data[key].push(data)    
}

function read(key){
    if (data[key] == undefined)
        return
    return data[key].pop()    
}

const server = http.createServer((request, response) => {
    response.statusCode = 200       
    
    const url_parts   = url.parse(request.url, true)
    if (url_parts.query.channel == undefined) {
        response.end()
        return    
    }    
    const channel     = url_parts.query.channel.toString()
    
    if (url_parts.query.destination != undefined){
        response.end()
        sch.add( 
            url_parts.query.destination.toString(),
            "/zen",
            write.bind(null, channel),       
            request
        )
    } 
    else
        response.end(read(channel))
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
});