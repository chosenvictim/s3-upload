var AWS = require('aws-sdk'),
    fs = require('fs'),
    path = require('path');

var bucketName = process.env.BUCKET;

var s3 = new AWS.S3();

/* ListAllBuckets */
var listBuckets = function() {
    s3.listBuckets(function(err, data) {
        if(err) { console.log(err); }
        else {
            for(var index in data.Buckets) {
                var bucket = data.Buckets[index];
                console.log("Bucket: ", bucket.Name, " : ", bucket.CreationDate);
            }
        }
    });
}

/* GetBucketAccessPolicy */
var getBucketPolicy = function() {
    var params = {
        Bucket: bucketName
    };
    s3.getBucketAcl(params, function(err, data) {
        if(err) { console.log(err); }
        else {
            console.log(data);
        }
    });
}

/* PutFile */
var uploadFiles = function(files) {
    console.log("Uploading files to Bucket: ", bucketName);
    files.forEach(function(file) {
        fs.readFile(file, function(err, data) {
            if(err) { throw err; }
            console.log("File to be uploaded: ", file);
            s3.putObject({
                Bucket: bucketName,
                Key: file,
                Body: data,
                ContentType: "text/html"
            }, function(err, url) {
                if(err) {
                    console.log(err);
                    throw err;
                }
                console.log(url);
                console.log(file, " saved successfully...");
            });
        });
    });
}

/* GetFile */
var downloadFiles = function(files) {
    console.log("Downloading from Bucket: ", bucketName);
    files.forEach(function(file) {
        s3.getObject({
            Bucket: bucketName,
            Key: file
        }, function(err, data) {
            if(err) {
                console.log(err);
                throw err;
            }
            console.log(file, " fetched successfully............................................................");
            console.log(data.Body.toString('utf-8'));
            console.log('.......................................................................................');
        });
    });
}

/* Recursively traverse a directory */
var traverseDirectory = function(dir, done) {
    var results = [];
    console.log(dir);
    fs.readdir(dir, function(err, list) {
        if(err) return done(err);
        var pending = list.length;
        if(!pending) return done(null, results)
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if(stat && stat.isDirectory()) {
                    traverseDirectory(file, function(err, res) {
                        results = results.concat(res);
                        if(!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if(!--pending) done(null, results);
                }
            });
        });
    });
}

var motive = process.env.MOTIVE;

if(motive === 'up') {
    traverseDirectory(process.env.START_DIR, function(err, results) {
         if(err) { throw err; }
         console.log("Directory structure: ", results);
         uploadFiles(results);
    });
} else if(motive === 'down') {
    traverseDirectory(process.env.START_DIR, function(err, results) {
        if(err) { throw err; }
        downloadFiles(results);
    });
} else if(motive === 'list') {
    listBuckets();
} else if(motive === 'policy') {
    getBucketPolicy();
} else {
    console.log("Please specify one of the MOTIVE: 'up' to Upload files, 'down' to Download files, 'list' to List Buckets and 'policy' to Get Bucket Policy");
}
