# scheduler.js
Chain your AJAX requests!

Example:
```JavaScript
 var scheduler = new Scheduler()
 
scheduler.add(                 // 1. request 
  "https://api.github.com/zen", // URL
  alert(text),                  // callback 
  "GET"                         // method
)

scheduler.add(…)                // 2. request
scheduler.add(…)                // 3. request and so on
```
