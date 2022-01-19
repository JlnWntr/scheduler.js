FROM node:17-alpine
COPY app.js app.js
EXPOSE 3000
ENV SCH_DESTINATION=localhost
ENV SCH_PORT=5001
CMD node app.js localhost 3000 $SCH_DESTINATION $SCH_PORT
