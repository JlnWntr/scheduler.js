# scheduler.js
Chain your AJAX requests for slow and sluggish servers!

Example:
```JavaScript
 var scheduler = new Scheduler()
 
 scheduler.add(   // first request 
  "https://api.stackexchange.com/2.2/info?site=stackoverflow", // URL
  function (text){ // callback 
    alert(
      JSON.parse(text).items[0].new_active_users
    )
  }, "GET" // method
)

scheduler.add(…)  // second request
scheduler.add(…)  // third request and so on
