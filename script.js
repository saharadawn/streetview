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
                                '&fov=50&heading=' + thumbnailViewpoint.heading + '&pitch=' + thumbnailViewpoint.pitch + '&key=AIzaSyD3f65XaCAyZAfkqnlnj_D0ruxgtyxU0HI'; // Replace YOUR_API_KEY with your actual API key
                            
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

            // Call the function to display existing snapshots on page load
            displayExistingSnapshots();
        });
}

function displayExistingSnapshots() {
    var snapshots = JSON.parse(localStorage.getItem('snapshots')) || [];
    var snapshotContainer = document.getElementById('snapshot-container');
    snapshotContainer.innerHTML = ''; // Clear existing content

    snapshots.forEach(function(snapshotUrl) {
        // Create anchor tag
        var anchor = document.createElement('a');
        anchor.href = snapshotUrl; // Set the href attribute to the snapshot URL
        anchor.target = '_blank'; // Open link in a new tab

        // Create image element
        var snapshotImage = document.createElement('img');
        snapshotImage.src = snapshotUrl;
        snapshotImage.style.width = '150px'; // Set width
        snapshotImage.style.height = '100px'; // Set height

        // Append the image to the anchor tag
        anchor.appendChild(snapshotImage);

        // Append the anchor tag to the snapshot container
        snapshotContainer.appendChild(anchor);
    });
}

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

    // Set the dimensions of the thumbnail
    var thumbnailWidth = 700; // Width for the thumbnail
    var thumbnailHeight = 400; // Height for the thumbnail

    // Use the Street View Image API to get a static image of the current panorama with the specified dimensions for the thumbnail
    var thumbnailUrl = 'https://maps.googleapis.com/maps/api/streetview?size=' + thumbnailWidth + 'x' + thumbnailHeight + '&pano=' + currentPano + '&heading=' + heading + '&pitch=' + pitch + '&fov=90&zoom=' + zoom + '&key=AIzaSyD3f65XaCAyZAfkqnlnj_D0ruxgtyxU0HI';

    // Create image element for the thumbnail
 
var thumbnailImage = document.createElement('img');
thumbnailImage.src = thumbnailUrl;
thumbnailImage.classList.add('snapshot-image'); // Add CSS class for styling


    // Store the thumbnail URL in local storage
    var snapshots = JSON.parse(localStorage.getItem('snapshots')) || [];
    snapshots.push(thumbnailUrl);
    localStorage.setItem('snapshots', JSON.stringify(snapshots));

    // Append the thumbnail image to the snapshot container
    var snapshotContainer = document.getElementById('snapshot-container');
    snapshotContainer.appendChild(thumbnailImage);

    // Add event listener to open snapshot in new tab with different dimensions
    thumbnailImage.addEventListener('click', function() {
        // Set the dimensions of the snapshot in the new tab
        var snapshotWidth = 600; // Width for the snapshot in the new tab
        var snapshotHeight = 430; // Height for the snapshot in the new tab

        // Use the Street View Image API to get a static image of the current panorama with the specified dimensions for the snapshot in the new tab
        var snapshotUrl = 'https://maps.googleapis.com/maps/api/streetview?size=' + snapshotWidth + 'x' + snapshotHeight + '&pano=' + currentPano + '&heading=' + heading + '&pitch=' + pitch + '&fov=90&zoom=' + zoom + '&key=AIzaSyD3f65XaCAyZAfkqnlnj_D0ruxgtyxU0HI';

        window.open(snapshotUrl, '_blank'); // Open snapshot URL in a new tab with specified dimensions for the snapshot
        
    });
}

// Function to download all snapshots as a zip file
function downloadAllSnapshots() {
    var snapshots = JSON.parse(localStorage.getItem('snapshots')) || [];
    if (snapshots.length === 0) {
        alert("No snapshots available to download.");
        return;
    }

    // Create a new instance of JSZip
    var zip = new JSZip();

    // Add each snapshot image to the zip file
    snapshots.forEach(function(snapshotUrl, index) {
        // Fetch the image
        fetch(snapshotUrl)
            .then(response => response.blob())
            .then(blob => {
                // Add the image to the zip file
                zip.file('snapshot_' + index + '.jpg', blob, { binary: true });
                if (index === snapshots.length - 1) {
                    // Once all images are added, generate the zip file
                    zip.generateAsync({ type: "blob" })
                        .then(function(content) {
                            // Trigger download
                            saveAs(content, "snapshots.zip");
                        });
                }
            })
            .catch(error => console.error("Error downloading snapshot:", error));
    });
}

// Add event listener to download all snapshots button
document.getElementById('download-all-snapshots-button').addEventListener('click', downloadAllSnapshots);

// Ensure this code is placed after the initialization of your map and other necessary elements.


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
