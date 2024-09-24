const { exec } = require('child_process');
const os = require('os');

function cleanupResources() {
  console.log('Avvio pulizia delle risorse di sistema...');

  if (os.platform() === 'linux' || os.platform() === 'darwin') {
    // Pulizia della cache del browser (Chrome/Chromium)
    exec('rm -rf ~/.cache/google-chrome', (error, stdout, stderr) => {
      if (error) {
        console.error(`Errore nella pulizia della cache di Chrome: ${error}`);
      } else {
        console.log('Cache di Chrome pulita');
      }
    });

    // Pulizia dei file temporanei di sistema
    exec('rm -rf /tmp/*', (error, stdout, stderr) => {
      if (error) {
        console.error(`Errore nella pulizia dei file temporanei: ${error}`);
      } else {
        console.log('File temporanei di sistema puliti');
      }
    });
  } else if (os.platform() === 'win32') {
    // Pulizia della cache di Chrome su Windows
    exec('rmdir /s /q "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache"', (error, stdout, stderr) => {
      if (error) {
        console.error(`Errore nella pulizia della cache di Chrome: ${error}`);
      } else {
        console.log('Cache di Chrome pulita');
      }
    });

    // Pulizia dei file temporanei di Windows
    exec('del /q /f /s %TEMP%\\*', (error, stdout, stderr) => {
      if (error) {
        console.error(`Errore nella pulizia dei file temporanei: ${error}`);
      } else {
        console.log('File temporanei di sistema puliti');
      }
    });
  }

  console.log('Pulizia delle risorse di sistema completata');
}

module.exports = { cleanupResources };
