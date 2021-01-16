const https = require('https');
// const http = require('http');
// const util = require('util');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();


exports.handler = async (event) => {
    console.log('testing');
    outputEnvironmentVariables();
    let dataString = '';
    //use date + Date.now to get timestamp to uniquily create filename
    //date.now is javascripts timestamp in milliseconds
    let S3_FILENAME_PRE = 'ABBuoy_' + getTodayDate() + '_' + Date.now();
   
    const response = await new Promise((resolve, reject) => {
        //https://pokeapi.co/api/v2/pokemon/ditto
        let URL = 'https://cormp.org/services/download.php?time='+ getTodayDate() + 'T00:00:00-04:00/'+ getTodayDate() + 'T23:59:59-05:00&tz=America/New_York&standard=false&parameters[]=LEJ3WAVE+Wave+direction&parameters[]=LEJ3WAVE+Wave+height&parameters[]=LEJ3WAVE+Wave+period&parameters[]=MASE-01+Mean+wave+direction&parameters[]=MASE-01+Mean+wave+period&parameters[]=MASE-01+Significant+wave+height&output=json';
        console.log(URL);

        const req = https.get(URL, function(res) {
          res.on('data', chunk => {
            dataString += chunk;
          });
          res.on('end', () => {
            resolve({
                statusCode: 200,
                body: JSON.parse(dataString)
            });
          });
        });
       
        req.on('error', (e) => {
          reject({
              statusCode: 500,
              body: 'Something went wrong!'
          });
        });
    });
   
    //store data to S3
    var formattedJson = JSON.stringify(dataString);
    console.log("Buoy data json=" + formattedJson);
    await putObjectToS3(formattedJson, S3_FILENAME_PRE).then(
        (value) => console.log('promise recieved=' + value)
    );
   
    console.log('done testing');    
    return response;

};

function getTodayDate() {
    var date = new Date(); // M-D-YYYY

    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();

    var dateString = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    return dateString;
}

async function putObjectToS3(data, nameOfFile) {
  //Write to file
  console.log("writing to s3 " + nameOfFile );
  var s3 = new AWS.S3();
  var params = {
      Bucket : process.env.s3_bucket,
      Key : nameOfFile + ".json",
      Body : data
  }
    try {
        console.log('put to s3');
        S3.putObject(params).promise();
        console.log('successful put to s3');
    } catch (e) {
        console.log("error storing to s3=" + e, e.stack)
    }
//   S3.putObject(params, function(err, data) {
//     if (err) console.log("error storing to s3=" + err, err.stack); // an error occurred
//     else     console.log("Put to s3 should have worked: " + data);           // successful response
//   }).promise();
}


    function outputEnvironmentVariables() {
        console.log('s3_bucket: ' + process.env.s3_bucket);
        console.log('api_url: ' + process.env.api_url);
    }