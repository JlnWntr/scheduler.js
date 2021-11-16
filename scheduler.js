/*
* Copyright (c) 2019-2020 JlnWntr (jlnwntr@gmail.com)
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

const DEFAULT_SCHEDULER_TIMEOUT     = 60000
const DEFAULT_CORS_MODE             = "cors" // no-cors, cors, *same-origin
const DEFAULT_CACHE                 = "no-cache" // *default, no-cache, reload, force-cache, only-if-cached

const SCHEDULER_JOB_STATUS_PENDING  = "pending"
const SCHEDULER_JOB_STATUS_RUNNING  = "running"
const SCHEDULER_JOB_STATUS_DONE     = "done"
SCHEDULER_AUTORUN                   = true


/* Constructor
 * @param timeout (optional)*/
function Scheduler(timeout) {
  this.running = false
  this.autorun = SCHEDULER_AUTORUN
  this.queue = []

  this.timeout = timeout
  if(this.timeout == undefined){
     this.timeout = DEFAULT_SCHEDULER_TIMEOUT
  }
}

/* Adds a request. After calling this function the scheduler will send its first request in the queue, if it is not running yet.
 * @param request URL
 *
 * Optional in this order:
 * @param callback function
 * @param method (GET, POST, PUT)
 * @param header for example {'Private-Token' : YOUR_KEY},
 * @param body for example {'Content-Type' : "application/json"}
 * */
Scheduler.prototype.add = function(request, callback, method, header, body) {
    var r = {
        method: (method === undefined) ? "POST" : method,
        mode: DEFAULT_CORS_MODE,
        cache: DEFAULT_CACHE,
        timeout: this.timeout
    }
    if (body != undefined)
        r.body = body
    if (header != undefined)
        r.headers = header
    this.queue.push({
        "request" : new Request(request, r),
        "callback" : callback,
        "status" : SCHEDULER_JOB_STATUS_RUNNING
    });
    if((this.running==false) && (this.autorun == true))
        this.work()
}

/*
 * Continues the queue. This function is called automatically at the end of  the add()-function.
 * @return false if still working, false otherwise
*/
Scheduler.prototype.work = function() {
    if(this.running)
        return true
    this.running = true

    var new_job = this.queue.shift()
    if (new_job == undefined) {
        this.running = false
        return false
    }
    new_job.status = SCHEDULER_JOB_STATUS_RUNNING
    fetch(new_job.request)
    .then(response => response.text())
    .then( function(job, that, json){
        if (job.callback !== undefined)
            job.callback((json))

        that.running = false
        job.status = SCHEDULER_JOB_STATUS_DONE

        that.work() // continue working
      }.bind(null, new_job, this)
    )
    .catch(error => console.error(error))
    return true
}

/*
 * Returns the number of pending request.
 * @return number pending jobs
*/
Scheduler.prototype.status = function(){
    var count = 0
    if(this.queue === undefined)
        return 0

    for (var i in this.queue){
        if ((this.queue[i] === undefined)
        ||  (this.queue[i].status === undefined)
        ||  (this.queue[i].status == SCHEDULER_JOB_STATUS_DONE)
        )
            continue
        count ++
    }
    return count
}