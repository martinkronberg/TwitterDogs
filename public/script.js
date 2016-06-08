var tweet_text='';
function initMap() {
    
    var marker = null;
    var socket = io();
    
    var startLatLng = {lat: 10, lng: 20};
    
    socket.on('location', function (data) {
    console.log(data.lat, data.lon);
    
    var lat = data.lat;
    var lon = data.lon;
    tweet_text = data.tweet_body;
    tweet_user = data.tweet_user;
    var myLatLng = {lat: lat, lng: lon};
     // Create a marker and set its position.
    marker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP,
    position: myLatLng,
    title:'tweet location'
  });

     //create info window to display tweet      
    var infowindow = new google.maps.InfoWindow({
    content:tweet_user + ": <br>" + tweet_text
  });

 
    infowindow.open(map,marker);   
    
    });

    
  // Create a map object and specify the DOM element for display.
  var map = new google.maps.Map(document.getElementById('map'), {
    center: startLatLng,
    scrollwheel: false,
    zoom: 2
  });
    

       
     
        
}