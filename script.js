

// Declare the map variable in a broader scope so it's accessible within the takeSnapshot function
var map;

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
                        document.getElementById('location-title').textContent = "title: " + randomLocation.title;
                        document.getElementById('location-text').textContent = "location: " + randomLocation.text;

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
                                '&fov=90&heading=' + thumbnailViewpoint.heading + '&pitch=' + thumbnailViewpoint.pitch + '&key=AIzaSyD3f65XaCAyZAfkqnlnj_D0ruxgtyxU0HI'; // Replace YOUR_API_KEY with your actual API key
                            
                            // Create a container for thumbnail and location name
                            var thumbnailContainer = document.createElement('div');
                            thumbnailContainer.classList.add('thumbnail-container');
                            
                            // Create thumbnail image
                            var thumbnailImage = document.createElement('img');
                            thumbnailImage.src = thumbnailUrl;
                            thumbnailImage.alt = location.text;
                            
                            // Create location name element
                            var locationName = document.createElement('p');
                            locationName.textContent = location.title;
                            
                            // Append thumbnail image and location name to the container
                            thumbnailContainer.appendChild(thumbnailImage);
                            thumbnailContainer.appendChild(locationName);
                            
                            // Add click event listener to set street view position
                            thumbnailContainer.addEventListener('click', function() {
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
                            
                            // Append the thumbnail container to the thumbnail panel
                            thumbnailPanel.appendChild(thumbnailContainer);
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

                var distanceText = "distance: " + (distance / 1000).toFixed(2) + " km";
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
            document.getElementById('snapshot-button').addEventListener('click', takeSnapshotAndDisplay);
        });
      

}
// Function to display existing snapshot images on page load
function displayExistingSnapshots() {
    var snapshots = JSON.parse(localStorage.getItem('snapshots')) || [];
    var snapshotContainer = document.getElementById('snapshot-container');
    snapshotContainer.innerHTML = ''; // Clear existing content

    snapshots.forEach(function(snapshotUrl) {
        var snapshotImage = document.createElement('img');
        snapshotImage.src = snapshotUrl;
        snapshotImage.style.width = '100px'; // Set width
        snapshotImage.style.height = '100px'; // Set height
        snapshotImage.addEventListener('click', function() {
            window.open(snapshotUrl, '_blank'); // Open snapshot URL in a new tab
        });
        snapshotContainer.appendChild(snapshotImage);
    });
}

// Call the function to display existing snapshots on page load
displayExistingSnapshots();

// Function to take a snapshot and display it in the location-info container
function takeSnapshotAndDisplay() {
    // Get the current panorama from the StreetViewService
    var panorama = map.getStreetView();
    var currentPano = panorama.getPano();

    // Get the current viewpoint (heading, pitch, and zoom)
    var viewpoint = panorama.getPov();

    // Extract heading, pitch, and zoom
    var heading = viewpoint.heading;
    var pitch = viewpoint.pitch;
    var zoom = panorama.getZoom();

    // Get the dimensions of the Street View container
    var container = document.getElementById('map-container');
    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;

    // Use the Street View Image API to get a static image of the current panorama with the same dimensions as the container
    var streetViewUrl = 'https://maps.googleapis.com/maps/api/streetview?size=' + containerWidth + 'x' + containerHeight + '&pano=' + currentPano + '&heading=' + heading + '&pitch=' + pitch + '&fov=90&zoom=' + zoom + '&key=AIzaSyD3f65XaCAyZAfkqnlnj_D0ruxgtyxU0HI';

    // Create image element
    var snapshotImage = document.createElement('img');
    snapshotImage.src = streetViewUrl;
    snapshotImage.style.width = '100px'; // Set width
    snapshotImage.style.height = '100px'; // Set height

    // Store the snapshot URL in local storage
    var snapshots = JSON.parse(localStorage.getItem('snapshots')) || [];
    snapshots.push(streetViewUrl);
    localStorage.setItem('snapshots', JSON.stringify(snapshots));

    // Append the snapshot image to the snapshot container
    var snapshotContainer = document.getElementById('snapshot-container');
    snapshotContainer.appendChild(snapshotImage);

    // Add event listener to open snapshot in new tab
    snapshotImage.addEventListener('click', function() {
        window.open(streetViewUrl, '_blank'); // Open snapshot URL in a new tab
    });
}

// Function to clear snapshots
function clearSnapshots() {
    // Clear snapshot URLs from local storage
    localStorage.removeItem('snapshots');

    // Remove displayed snapshot images from the page
    var snapshotContainer = document.getElementById('snapshot-container');
    snapshotContainer.innerHTML = ''; // Clear existing content
}

// Add event listener to clear snapshots button
document.getElementById('clear-snapshots-button').addEventListener('click', clearSnapshots);
