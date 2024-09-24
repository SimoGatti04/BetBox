export function getRomeTime() {
    return new Date().toLocaleString("en-US", {timeZone: "Europe/Rome"});
}
