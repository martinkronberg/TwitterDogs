/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
//dog name twitter hashtags that the code will monitor for
var dog1 = '#fluffythedog';
var dog2 = '#rufusthedog';

//module requires:
//geocoder module and settings
var geocoderProvider = 'google';
var httpAdapter = 'https';
var extra = {
    apiKey: '<YOUR GOOGLE API KEY HERE>', // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
};
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);
//Load twit module
var Twit = require('twit');
//Load stepper module
var Uln200xa_lib = require('jsupm_uln200xa');
//Load lcd module
var lcd = require('jsupm_i2clcd');
//express module
var express = require('express');
//start express app
var app = express();
//start http server
var server = require('http').Server(app);
//start socket.io server
var io = require('socket.io')(server);

//create connection to the twitter api - enter your token info below!
var T = new Twit({
    consumer_key: '<TWITTER PUBLIC KEY>',
    consumer_secret: '<TWITTER PRIVATE KEY>',
    access_token: '<TWITTER ACCESS TOKEN>',
    access_token_secret: '<TWITTER SECRET ACCESS TOKEN>'
});

// Instantiate a Stepper motor on a ULN200XA Darlington Motor Driver
// This was tested with the Grove Geared Step Motor with Driver
var myUln200xa_obj = new Uln200xa_lib.ULN200XA(4096, 8, 9, 10, 11);

//stepper motor control functions
myUln200xa_obj.forward = function(steps) {
    ; // 5 RPMs
    myUln200xa_obj.setDirection(Uln200xa_lib.ULN200XA.DIR_CW);
    console.log("Rotating " + steps + " revolution clockwise.");
    myUln200xa_obj.stepperSteps(steps);
};

myUln200xa_obj.reverse = function(steps) {
    console.log("Rotating " + steps + " counter clockwise.");
    myUln200xa_obj.setDirection(Uln200xa_lib.ULN200XA.DIR_CCW);
    myUln200xa_obj.stepperSteps(steps);
};

myUln200xa_obj.stop = function() {
    myUln200xa_obj.release();
    console.log('stepper power off');
};

myUln200xa_obj.quit = function() {
    myUln200xa_obj = null;
    Uln200xa_lib.cleanUp();
    Uln200xa_lib = null;
    console.log("Exiting");
    process.exit(0);
};

//Instantiate LCD JHD1313 module on the i2c bus
var display = new lcd.Jhd1313m1(0, 0x3E, 0x62);


//begin twitter stream tracking the hashtags specified above 
var stream = T.stream('statuses/filter', {
    track: [dog1, dog2]
})

var dog1_tweets = 0;
var dog2_tweets = 0;
var dog_side = 1;
var tweet_lat = 0;
var tweet_lon = 0;
var tweet_body = "";
var tweet_user = "";

function get_coord(location, user, text, callback) {
    if(typeof location == "string"){
    geocoder.geocode(location, function(err, res) {
        tweet_lat = res[0].latitude;
        tweet_lon = res[0].longitude;
        tweet_body = text;
        tweet_user = user;
        callback();
    });
    }
    else{
        console.log("location undefined, sending default location");
        tweet_lat = 0;
        tweet_lon = 0;
        tweet_body = text;
        tweet_user = user;
        callback();
    }
}

function emitsocket() {
    io.emit('location', {
        lat: tweet_lat,
        lon: tweet_lon,
        tweet_user: tweet_user,
        tweet_body: tweet_body
    });
}

io.on('connection', function(socket) {
    console.log('io connection')

});

//begin code block that will run when the stream registers a tweet 
stream.on('tweet', function(tweet) {

    get_coord(tweet.user['location'], tweet.user['name'], tweet['text'], emitsocket);

    console.log("tweet stream is on")
    var text_body = tweet['text'];

    //if the tweet contains hashtag for dog1:
    if (text_body.toLowerCase().indexOf(dog1) != -1) {
        dog1_tweets = dog1_tweets + 1;
        console.log(tweet['text'])
        console.log('dog 1 tweets: ' + dog1_tweets);

        //LCD controls 
        display.setColor(0, 155, 155);
        display.setCursor(0, 0);
        display.write(dog1_tweets + ' for ' + dog1);
        display.setCursor(1, 0);
        display.write(dog2_tweets + ' for ' + dog2);

        //Servo controls 
        if (dog_side == 2) {

            myUln200xa_obj.reverse((dog1_tweets + dog2_tweets) * 50);
            myUln200xa_obj.stop();
            dog_side = 1;
        } else if (dog_side == 1) {

            myUln200xa_obj.reverse(50);
            myUln200xa_obj.stop();
            dog_side = 1;
        }
    }

    //if the tweet contains hashtag for dog2:
    else if (text_body.toLowerCase().indexOf(dog2) != -1) {
        dog2_tweets = dog2_tweets + 1;
        console.log(tweet['text'])
        console.log(dog2 + ' tweets: ' + dog2_tweets);

        //LCD controls
        display.setColor(0, 155, 155);
        display.setCursor(0, 0);
        display.write(dog1_tweets + ' for ' + dog1);
        display.setCursor(1, 0);
        display.write(dog2_tweets + ' for ' + dog2);

        //servo controls 
        if (dog_side == 1) {
            dog_side = 2;
            myUln200xa_obj.forward((dog2_tweets + dog1_tweets) * 50);
            myUln200xa_obj.stop();
        } else if (dog_side == 2) {
            myUln200xa_obj.forward(50);
            myUln200xa_obj.stop();
            dog_side = 2;
        }

    };
    //victory condition met (first dog to 10 votes)
    if (dog1_tweets >= 10) {
        display.setColor(0, 255, 0);
        display.setCursor(0, 0);
        display.write(dog1 + "        ");
        display.setCursor(1, 0);
        display.write("Is cutest dog!");
    }

    if (dog2_tweets >= 10) {
        display.setColor(0, 255, 0);
        display.setCursor(0, 0);
        display.write(dog2 + "        ");
        display.setCursor(1, 0);
        display.write("Is cutest dog!");
    }
});

app.use(express.static(__dirname+'/public/'));

app.get('/', function(req, res) {
    res.sendFile("/home/root/.node_app_slot/public/index.html");
});

server.listen(3000, function() {
    console.log('example app listening on port 3000');
})
