
/**
 * Module dependencies
 */

var natural = require('natural')
var db = require('./prop.json')
var first = require('./first.json')
var last = require('./last.json')
var nicknames = require('./nicknames.json')

/**
 * Constants
 */

var THRESHOLD = 0.87
var FALLBACK_PROB = 0


function scoreFirstName(n) {
  var fnameProb = FALLBACK_PROB
  var match = -1

  var fname = n.trim().split(' ')
  fname = fname[0]

  // Check name against common 1990 Census first names, keep the best score.
  for (var i = 0; i < first.length; i++) {
    match = natural.JaroWinklerDistance(fname, first[i].name)
    if(match > fnameProb) {
      fnameProb = match
    }
    // Stop if exact match
    if (fnameProb === 1) break;
  }

  // If we didn't get an exact match, see if nicknames work here.
  if ((fnameProb < 1) && (!!nicknames[fname])) {
    for (var j = 0; j < nicknames[fname].length; j++) {
      var nickname = nicknames[fname][j];
      for (var i = 0; i < first.length; i++) {
        match = natural.JaroWinklerDistance(nickname, first[i].name)
        if(match > fnameProb) {
          fnameProb = match
        }
        // Stop if exact match
        if (fnameProb === 1) break;
      }
      // Stop if exact match
      if (fnameProb === 1) break;
    }
  }

  return fnameProb
}

function scoreLastName(n) {
  var lnameProb = FALLBACK_PROB
  match = -1

  var lname = n.trim()

  // Check name against common 1990 Census last names, keep the best score.
  for (var i = 0; i < last.length; i++) {
    match = natural.JaroWinklerDistance(lname, last[i].name)
    if(match > lnameProb) {
      lnameProb = match;
    }
    // Stop if exact match
    if (lnameProb === 1) break;
  }

  return lnameProb
}

var weightedData = db.map(function(p){

  var match = -1
  var name = p.can_nam.split(',')

  var fnameProb = FALLBACK_PROB
  var lnameProb = FALLBACK_PROB

  if (name.length >= 2) {
    // Name has more than two comma-delimited parts
    // (i.e "LASTNAME,FIRSTNAME"), most common case.
    fnameProb = scoreFirstName(name[1])
    lnameProb = scoreLastName(name[0])
  } else {
    // A single-name string. Like "HIP HOP FOR PRESIDENT".

    // Right now just pass through since firstname and lastname
    // probabilities should be zero.
  }

  return {
    name: p.can_nam,
    fnameProb: fnameProb,
    lnameProb: lnameProb,
    probability: (fnameProb+lnameProb)/2.0,
    link: p.lin_ima,
    id: p.can_id
  }
})

var funnyNames = weightedData.filter(function(el) {
  return el.probability < THRESHOLD
})

console.log(JSON.stringify(funnyNames, null, '\t'))
