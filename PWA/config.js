const isTestMode = false;
const isiPhoneDebug = false;

let apiBaseUrl;

if (!isTestMode) {
    //apiBaseUrl = 'https://legally-modest-joey.ngrok-free.app';
    apiBaseUrl = 'https://betbox.simogatti.site';
} else if (isTestMode && !isiPhoneDebug) {
    apiBaseUrl = 'http://localhost:3000';
} else if (isTestMode && isiPhoneDebug) {
    apiBaseUrl = 'http://192.168.0.58:3000';
}

const config = {
    apiBaseUrl: apiBaseUrl
};

export default config;
