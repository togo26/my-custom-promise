/**
 * Let's make my custom promise!
 *
 * <Static>
 * Promise.resolve
 * Promise.reject
 *
 * <Prototype>
 * Promise.prototype.resolve
 * Promise.prototype.reject
 * Promise.prototype.then
 * Promise.prototype.catch
*/

// Implementation
class MyPromise {
  constructor(promiseCallback) {
    this.status = 'pending';
    this._resolutionCallbackQueue = [];
    this._rejectionCallback = null;
    this._promiseCallback = promiseCallback ?
      promiseCallback(this.resolve.bind(this), this.reject.bind(this)) : null;
  }

  static resolve(value) {
    return new MyPromise().resolve(value);
  }

  static reject(value) {
    return new MyPromise().reject(value);
  }

  resolve(value) {
    queueMicrotask((() => {
      this.status = 'fulfilled';
      this._resolutionCallbackQueue.reduce((result, callback) => {
        if (result instanceof Error) return this.reject(result);
        return callback(result);
      }, value);
    }).bind(this));

    return this;
  }

  reject(error) {
    queueMicrotask((() => {
      this.status = 'rejected';
      this._rejectionCallback(error);
    }).bind(this));

    return this;
  }

  then(callback, rejectionCallback) {
    this._resolutionCallbackQueue.push(callback);
    this._rejectionCallback = rejectionCallback ? rejectionCallback : null;
    return this;
  }

  catch(callback) {
    this._rejectionCallback = callback;
  }
}

// Custom promise test

// The macro task should run after the micro task completes
setTimeout(() => console.log('setTimeout 1'));
setTimeout(() => console.log('setTimeout 2'));

const promise = new MyPromise(resolve => {
  setTimeout(() => {
    resolve(10);
  }, 1000);
});

const errorPromise = new MyPromise((_, reject) => {
  setTimeout(() => {
    reject(100);
  }, 2000);
});

promise
  .then(res => res + 200)
  .then(res => res + 400)
  .then(res => res + 1000)
  .then(res => console.log(res)) // 1610
  .catch(error => console.error(error.message));

errorPromise
  .then(
    res => console.log(res),
    error => console.error('error', error) // 100
  );

MyPromise.resolve('1').then(res => console.log('Resolved', res));
MyPromise.reject('2').catch(error => console.error('Rejected', error));

/**
 * ---------------------------------------------------------------
 * Custom fetch with custom promise
 * ---------------------------------------------------------------
*/

// Implementation
const myFetch = (url, method) => {
  return new MyPromise((resolve, reject) => {
    // XMLHttpRequest is running on a browser
    const request = new XMLHttpRequest();

    request.onload = function (e) {
      if (e.target.status < 400) {
        resolve(JSON.parse(e.target.response));
      } else {
        reject(new Error(`Status ${e.target.status}, Request failed`));
      }
    }

    request.onerror = function () {
      reject(new Error('Request failed, check your preference'));
    }

    request.open(method || 'GET', url);
    request.send();
  });
}

// Custom fetch test
const result = myFetch('https://itunes.apple.com/us/rss/topalbums/limit=100/json');
const errorResult = myFetch('https://fake.fake.fake');

result
  .then(res => console.log(res)) // Succeed
  .catch(error => console.error(error));

errorResult
  .then(res => console.log(res))
  .catch(error => console.error(error)); // Failed
