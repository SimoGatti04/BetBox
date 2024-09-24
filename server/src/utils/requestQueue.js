// src/utils/RequestQueue.js

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(request) {
    this.queue.push(request);
    this.processNext();
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const request = this.queue.shift();

    try {
      await request();
    } catch (error) {
      console.error('Errore durante l\'esecuzione della richiesta:', error);
    } finally {
      this.processing = false;
      await this.processNext();
    }
  }
}

module.exports = RequestQueue;

