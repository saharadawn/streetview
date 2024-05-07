function getRandomLocation(locations) {
    return locations[Math.floor(Math.random() * locations.length)];
}

document.getElementById('refresh-button').addEventListener('click', function() {
    location.reload();
});

function initMap() {
    fetch('data.json')
        .then(response => response.json())
        .then(locations => {
            var map;
            var panorama;

            function initializeMap(randomLocation) {
                map = new google.maps.Map(document.getElementById("map"), {
                    center: randomLocation,
                    zoom: 14
                });

                var streetViewService = new google.maps.StreetViewService();
                var streetViewRequest = {
                    location: randomLocation,
                    preference: google.maps.StreetViewPreference.NEAREST,
                    radius: 50,
                    source: google.maps.StreetViewSource.OUTDOOR
                };

                streetViewService.getPanorama(streetViewRequest, function(data, status) {
                    if (status === 'OK') {
                        var exactViewpoint = randomLocation.exactViewpoint || {};
                        panorama = new google.maps.StreetViewPanorama(
                            document.getElementById('map'), {
                                pano: data.location.pano,
                                pov: exactViewpoint,
                                visible: true,
                                showRoadLabels: false,
                                disableDefaultUI: true
                            });
                        map.setStreetView(panorama);

                        // Update title, location, and distance text
                        document.getElementById('location-title').textContent = "Title: " + randomLocation.title;
                        document.getElementById('location-text').textContent = "Location: " + randomLocation.text;

                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(function(position) {
                                updateDistanceText(position.coords.latitude, position.coords.longitude, randomLocation);
                            });
                        } else {
                            document.getElementById('distance-text').textContent = "Geolocation is not supported by this browser.";
                        }
                    } else {
                        console.error('Street View data not found for this location:', status);
                    }

                });

                // Add event listeners to thumbnail images
                var thumbnailPanel = document.getElementById('thumbnails-panel');
                locations.forEach(function(location) {
                    var streetViewRequestThumbnail = {
                        location: location,
                        preference: google.maps.StreetViewPreference.NEAREST,
                        radius: 50,
                        source: google.maps.StreetViewSource.OUTDOOR
                    };
                    streetViewService.getPanorama(streetViewRequestThumbnail, function(data, status) {
                        if (status === 'OK') {
                            var exactViewpoint = location.exactViewpoint || {};
                            var panoramaOptions = panorama.getPhotographerPov(); // Get main street view POV
                            var thumbnailViewpoint = {
                                heading: exactViewpoint.heading || panoramaOptions.heading,
                                pitch: exactViewpoint.pitch || panoramaOptions.pitch
                            };
                            var thumbnailUrl = 'https://maps.googleapis.com/maps/api/streetview?size=200x200&location=' + location.lat + ',' + location.lng +
                                '&fov=90&heading=' + thumbnailViewpoint.heading + '&pitch=' + thumbnailViewpoint.pitch + '&key=YOUR_API_KEY'; // Replace YOUR_API_KEY with your actual API key
                            var thumbnailImage = document.createElement('img');
                            thumbnailImage.src = thumbnailUrl;
                            thumbnailImage.alt = location.text;
                            thumbnailImage.addEventListener('click', function() {
                                panorama.setPosition(location);
                                panorama.setPov(thumbnailViewpoint);

                                // Update typing text
                                document.getElementById('location-title').textContent = "Title: " + location.title;
                                document.getElementById('location-text').textContent = "Location: " + location.text;

                                // Update distance text
                                if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(function(position) {
                                        updateDistanceText(position.coords.latitude, position.coords.longitude, location);
                                    });
                                } else {
                                    document.getElementById('distance-text').textContent = "Geolocation is not supported by this browser.";
                                }
                            });
                            thumbnailPanel.appendChild(thumbnailImage);
                        } else {
                            console.error('Street View data not found for thumbnail:', status);
                        }
                    });
                });
            }

            function updateDistanceText(userLat, userLng, location) {
                var distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(userLat, userLng),
                    new google.maps.LatLng(location.lat, location.lng)
                );

                var distanceText = "Distance: " + (distance / 1000).toFixed(2) + " km";
                document.getElementById('distance-text').textContent = distanceText;
            }

            // Initialize map with a random location
            var initialLocation = getRandomLocation(locations);
            initializeMap(initialLocation);

            // Update text upon refresh button click
            document.getElementById('refresh-button').addEventListener('click', function() {
                var newLocation = getRandomLocation(locations);
                initializeMap(newLocation);
            });
        });
}
