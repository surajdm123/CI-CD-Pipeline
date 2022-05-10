const chalk = require('chalk');
const path = require('path');
const os = require('os');

got = require('got');

const http = require('http');
const httpProxy = require('http-proxy');
const { async } = require('hasbin');

const greenServerIp = process.argv[2];

const blueServerIp = process.argv[3];

const BLUE  = `http://${blueServerIp}`;
const GREEN = `http://${greenServerIp}`;

class Production
{
    constructor()
    {
        this.TARGET = GREEN;
        setInterval( this.healthCheck.bind(this), 5000 );
    }

    // TASK 1: 
    proxy()
    {
        let options = {};
        let proxy   = httpProxy.createProxyServer(options);
        let self = this;
        // Redirect requests to the active TARGET (BLUE or GREEN)
        let server  = http.createServer(function(req, res)
        {
            // callback for redirecting requests.
            proxy.web( req, res, {target: self.TARGET } );
        });
        server.listen(3090);
   }

   failover()
   {
      this.TARGET = BLUE;
   }

   async healthCheck()
   {
      try 
      {
         const response = await got(this.TARGET, {throwHttpErrors: false});
         let status = response.statusCode == 200 ? chalk.green(response.statusCode) : chalk.red(response.statusCode);
         console.log( chalk`{grey Health check on ${this.TARGET}}: ${status}`);

         if(response.statusCode === 500) {
             this.failover()
         }

      }
      catch (error) {
         console.log(error);
         this.failover();
      }
   }
   
}

async function run() {

    console.log(chalk.keyword('pink')('Starting proxy on localhost:3090'));

    let prod = new Production();
    prod.proxy();

}

console.log(chalk.keyword('pink')('Starting proxy on localhost:3090'));

let prod = new Production();
prod.proxy();