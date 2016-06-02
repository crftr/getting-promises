var Q = require('q');
var request = require('request')

var cloudwatchSuccess = true;
var cloudwatchMessage = 'No requests made';

function responseWasSuccessful(error, response) {
  return !error
    && response.statusCode === 200
    && response.headers['content-length'] > 0;
};

function saveLastSuccess(response) {
  if (cloudwatchSuccess === true) {
    cloudwatchMessage = [
      'SUCCESS! Last fetched URL was',
      response.request.href,
      response.headers['content-length']
    ].join(' ');
  }
};

function saveFirstError(response) {
  if (cloudwatchSuccess === true) {
    cloudwatchSuccess = false;
    cloudwatchMessage = [
      'Failed while completing',
      response.request.href
    ].join(' ');
  }
};

function getJSON(url, user, pass) {
  var deferred = Q.defer();

  request({
    url: url,
    json: true,
    auth: {
      user: user || '',
      pass: pass || ''
    }
  }, verifySuccess);

  function verifySuccess(error, response, body) {
    var outcome_label = 'error';
    if (responseWasSuccessful(error, response)) {
      saveLastSuccess(response);
      outcome_label = 'success';
    } else {
      saveFirstError(response);
      outcome_label = 'error';
    }

    deferred.resolve([
      response.statusCode,
      outcome_label,
      response.request.href,
      response.headers['content-length']
    ].join(' '));
  };

  return deferred.promise;
}

Q.all([
  getJSON('http://jsonplaceholder.typicode.com/posts'),
  getJSON('http://jsonplaceholder.typicode.com/users'),
  getJSON('http://jsonplaceholder.typicode.com/albums', 'user', 'pass')
]).then(function individualResults(results) {
  results.forEach(function (result) {
    console.log(result);
  });
}).finally(function runSummary() {
  if (cloudwatchSuccess) {
    console.log('OK', cloudwatchMessage);
    // context.succeed(cloudwatchMessage);
  } else {
    console.log('ERR', cloudwatchMessage);
    // context.fail(cloudwatchMessage);
  }
});
