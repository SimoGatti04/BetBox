// @.../src/utils/randomTime.js

function getRandomTime() {
  const start = new Date();
  start.setHours(19, 20, 0, 0); // Mezzanotte
  const end = new Date();
  end.setHours(19, 30, 0, 0); // 9 di mattina

  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

module.exports = getRandomTime;
