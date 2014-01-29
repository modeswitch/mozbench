var MozBench = (function() {

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var result = {};
function record(key, value) {
  result[key] = new Number(value).valueOf();
}

function submit() {
  var message = {
    'method': 'worker.result',
    'options': {
      'worker': getParameterByName('worker'),
      'result': result
    }
  };

  var req = new XMLHttpRequest();
  req.open("POST", getParameterByName('reply'));
  req.send(JSON.stringify(message));
}

return {
  'record': record,
  'submit': submit
}

})();