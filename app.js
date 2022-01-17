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


/***
 * This will start a node.js server, which provides a simple message-queue.
 * See messagequeue_test.html
 */

const hostname      = "127.0.0.1"
const port          = 3000
const request =  {
    method: "GET",
    mode: "cors", // no-cors, cors, *same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache,
    timeout: 10000,        
    hostname: "api.github.com",
    port: 443,
    path: "/zen",        
    headers: {"user-agent": "Mozilla"}
}
const max_buffer_size = 100

const http          = require("http")
const https         = require("https")
const url           = require("url")

var sch               = new Scheduler()
var data              = []

function Scheduler(timeout) {
    this.running = false    
    this.queue = []
}

Scheduler.prototype.add = function (callback) {     
    this.queue.push({
        "request": request,
        "callback": callback
    })
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
    
    const req = https.request(new_job.request, function (job, that, res){            
        res.on("data", function(callback, json){
          if (callback !== undefined) callback(json.toString())
        }.bind(null, job.callback))        
        that.running = false       
        that.work()
      }.bind(null, new_job, this)
    )  
    req.on("error", error => {console.error(error)})          
    req.end()
    return true
}

function write(key, d){
    for (var i=0; i<data.length; i++){
        if (data[i].key.localeCompare(key) == 0){                       
            if (data[i].data.length >= max_buffer_size)
                data[i].data.shift()
            data[i].data.push(d) //;console.log(data)     
            return
        }
    }    
    if (data.length >= max_buffer_size)
        data.shift()
    data.push({key:key, data:[d]})//; console.log(data)       
}

function read(key){
    for (var i=0; i<data.length; i++)
        if (data[i].key.localeCompare(key) == 0)
            return data[i].data.shift()  
}

const server = http.createServer((request, response) => {   
    response.setHeader("Access-Control-Allow-Origin", "*")   
    response.setHeader("Access-Control-Allow-Methods", "GET, POST")   
    //response.setHeader("Access-Control-Allow-Credentials", true)
    response.statusCode = 200       
    
    const url_parts = url.parse(request.url, true)
    if (url_parts.query.channel == undefined) {
        response.end()
        return    
    } 
    const channel = url_parts.query.channel.toString() 
    
    if (request.method == "POST") {
        response.end()
        sch.add(write.bind(null, channel))        
    } 
    else{    
        response.end(read(channel))
    }
})

server.listen(port, hostname, () => {console.log(`Server running at http://${hostname}:${port}/`)})