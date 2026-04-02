// geolocation.js

function getLocation() {
    // 1. Check if the browser supports the Geolocation API
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true, // Use GPS if available for better precision
            timeout: 5000,            // Time to wait before error (ms)
            maximumAge: 0             // Do not use a cached position
        };

        // 2. Request current position
        navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Success callback function
function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    console.log(`Accuracy: ${position.coords.accuracy} meters`);
}

// Error callback function
function error(err) {
    switch (err.code) {
        case err.PERMISSION_DENIED:
            console.warn("User denied the request for Geolocation.");
            break;
        case err.POSITION_UNAVAILABLE:
            console.warn("Location information is unavailable.");
            break;
        case err.TIMEOUT:
            console.warn("The request to get user location timed out.");
            break;
        default:
            console.warn("An unknown error occurred.");
            break;
    }
}

// Run the function
getLocation();
