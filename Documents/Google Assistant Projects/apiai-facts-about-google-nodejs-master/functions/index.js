// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const { ApiAiApp } = require('actions-on-google');
const functions = require('firebase-functions');
const { sprintf } = require('sprintf-js');
var fetch = require('node-fetch');

const API_ROOT_URL = "https://api.github.com";
var pageCount = 1;

const strings = require('./strings');

process.env.DEBUG = 'actions-on-google:*';

/** API.AI Actions {@link https://api.ai/docs/actions-and-parameters#actions} */
const Actions = {
  UNRECOGNIZED_DEEP_LINK: 'deeplink.unknown',
  TELL_FACT: 'tell.fact',
  TELL_CAT_FACT: 'tell.cat.fact',
  TELL_PROFILE: 'tell.github.profile',
  SHOW_TRENDING_REPOS: 'show.trending.repos',
  SHOW_TRENDING_REPOS: 'show.trending.repos',
};
/** API.AI Parameters {@link https://api.ai/docs/actions-and-parameters#parameters} */
const Parameters = {
  CATEGORY: 'category'
};
/** API.AI Contexts {@link https://api.ai/docs/contexts} */
const Contexts = {
  FACTS: 'choose_fact-followup',
  CATS: 'choose_cats-followup'
};
/** API.AI Context Lifespans {@link https://api.ai/docs/contexts#lifespan} */
const Lifespans = {
  DEFAULT: 5,
  END: 0
};

/**
 * @template T
 * @param {Array<T>} array The array to get a random value from
 */
const getRandomValue = array => array[Math.floor(Math.random() * array.length)];

/** @param {Array<string>} facts The array of facts to choose a fact from */
const getRandomFact = facts => {
  if (!facts.length) {
    return null;
  }
  const fact = getRandomValue(facts);
  // Delete the fact from the local data since we now already used it
  facts.splice(facts.indexOf(fact), 1);
  return fact;
};

/** @param {Array<string>} messages The messages to concat */
const concat = messages => messages.map(message => message.trim()).join(' ');

// Polyfill Object.values to get the values of the keys of an object
if (!Object.values) {
  Object.values = o => Object.keys(o).map(k => o[k]);
}

/** @typedef {*} ApiAiApp */

/**
 * Greet the user and direct them to next turn
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const unhandledDeepLinks = app => {
  /** @type {string} */
  const rawInput = app.getRawInput();
  const response = sprintf(strings.general.unhandled, rawInput);
  /** @type {boolean} */
  const screenOutput = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
  if (!screenOutput) {
    return app.ask(response, strings.general.noInputs);
  }
  const suggestions = Object.values(strings.categories).map(category => category.suggestion);
  const richResponse = app.buildRichResponse()
    .addSimpleResponse(response)
    .addSuggestions(suggestions);

  app.ask(richResponse, strings.general.noInputs);
};

/**
 * @typedef {Object} FactsData
 * @prop {{[category: string]: Array<string>}} content
 * @prop {Array<string> | null} cats
 */

/**
 * @typedef {Object} AppData
 * @prop {FactsData} facts
 */

/**
 * Set up app.data for use in the action
 * @param {ApiAiApp} app ApiAiApp instance
 */
const initData = app => {
  /** @type {AppData} */
  const data = app.data;
  if (!data.facts) {
    data.facts = {
      content: {},
      cats: null
    };
  }
  return data;
};

/**
 * Say a fact
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const tellFact = app => {
  const data = initData(app);
  const facts = data.facts.content;
  //making array of repo object
var repos = [];

  //var githubMainUrl =  API_ROOT_URL+"/search/users?q=+location:lagos+language:java&page="+pageCount;
    var githubMainUrl = "https://api.github.com/search/repositories?q=+language:c++&sort=stars&order=desc";

  var richResponse = app.buildRichResponse()
  .addSimpleResponse("Alrighty, Checking Up")

  fetch(githubMainUrl)
  .then(function(res) {
      return res.json();
  }).then(function(json) {
      console.log(json);
      console.error(json);
      var jsonData = json;
    for (var key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      console.log(jsonData[key].description);
      console.log(jsonData[key].name);
      console.log(jsonData[key].url);
      console.log(jsonData[key].owner.login);

      var owner_username = jsonData[key].owner.login;
      var repo_desc = jsonData[key].description;
      var repo_link = jsonData[key].url;
      var repo_name = jsonData[key].name;
      var owner_avatar = jsonData[key].owner.avatar_url;

      var new_repo = {owner_username: owner_username, 
        repo_desc: repo_desc, 
        repo_link: repo_link, 
        repo_name: repo_name,
        owner_avatar: owner_avatar};

      repos.push(new_repo);}
  }
  for (var repo in repos) {
    const card = app.buildBasicCard(repo.repo_name)
    .addButton(repo.repo_link, "Check it out")
    .setImage(repo.owner_avatar, "owned by "+owner_username);

    richResponse.addBasicCard(card).addSimpleResponse(repo.repo_desc);
    richResponse.addSimpleResponse("Check if res added");
  }

  richResponse.addSimpleResponse("Final Check "+repos.length);
  app.ask(richResponse, strings.general.noInputs);

  }).catch(err => {console.log(err);});

    // fetch(githubMainUrl, {
    //   method: 'GET'
    // }).then(body => {
    //   var jsonDat = JSON.stringify(body);
    //   console.error(jsonDat);
    //   var jsonData = JSON.parse(jsonDat);
    // for (var key in jsonData) {
    // if (jsonData.hasOwnProperty(key)) {
    //   console.log(jsonData[key].description);
    //   console.log(jsonData[key].name);
    //   console.log(jsonData[key].url);
    //   console.log(jsonData[key].owner.login);

    //   var owner_username = jsonData[key].owner.login;
    //   var repo_desc = jsonData[key].description;
    //   var repo_link = jsonData[key].url;
    //   var repo_name = jsonData[key].name;
    //   var owner_avatar = jsonData[key].owner.avatar_url;

    //   var new_repo = {owner_username: owner_username, 
    //     repo_desc: repo_desc, 
    //     repo_link: repo_link, 
    //     repo_name: repo_name,
    //     owner_avatar: owner_avatar};

    //   repos.push(new_repo);

    // }
    // else
    // {
    //   console.log("No Property")
    //   richResponse.addSimpleResponse("False key");
    // }
    // }

    // for (var repo in repos) {
    //   const card = app.buildBasicCard(repo.repo_name)
    //   .addButton(repo.repo_link, "Check it out")
    //   .setImage(repo.owner_avatar, "owned by "+owner_username);

    //   richResponse.addBasicCard(card).addSimpleResponse(repo.repo_desc);
    //   richResponse.addSimpleResponse("Check if res added");
    // }

    // richResponse.addSimpleResponse("Final Check "+repos.length);
    // app.ask(richResponse, strings.general.noInputs);
    
    // }).catch(err => {console.log(err);});
};
/**
 * Say a cat fact
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const tellCatFact = app => {
  const data = initData(app);
  if (!data.facts.cats) {
    data.facts.cats = strings.cats.facts.slice();
  }
  const catFacts = data.facts.cats;
  const fact = getRandomFact(catFacts);
  /** @type {boolean} */
  const screenOutput = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);
  if (!fact) {
    // Add facts context to outgoing context list
    app.setContext(Contexts.FACTS, Lifespans.DEFAULT, {});
    // Replace outgoing cat-facts context with lifespan = 0 to end it
    app.setContext(Contexts.CATS, Lifespans.END, {});
    if (!screenOutput) {
      return app.ask(strings.transitions.cats.heardItAll, strings.general.noInputs);
    }
    const richResponse = app.buildRichResponse()
      .addSimpleResponse(strings.transitions.cats.heardItAll, strings.general.noInputs)
      .addSuggestions(strings.general.suggestions.confirmation);

    return app.ask(richResponse);
  }
  const factPrefix = sprintf(strings.cats.factPrefix, getRandomValue(strings.cats.sounds));
  if (!screenOutput) {
    // <speak></speak> is needed here since factPrefix is a SSML string and contains audio
    return app.ask(`<speak>${concat([factPrefix, fact, strings.general.nextFact])}</speak>`, strings.general.noInputs);
  }


  const image = getRandomValue(strings.cats.images);
  const [url, name] = image;
  const card = app.buildBasicCard(fact)
    .setImage(url, name)
    .addButton(strings.general.linkOut, strings.cats.link);

  const richResponse = app.buildRichResponse()
    .addSimpleResponse(`<speak>${factPrefix}</speak>`)
    .addBasicCard(card)
    .addSimpleResponse(strings.general.nextFact)
    .addSuggestions(strings.general.suggestions.confirmation);

  app.ask(richResponse, strings.general.noInputs);
};

/** @type {Map<string, function(ApiAiApp): void>} */
const actionMap = new Map();
actionMap.set(Actions.UNRECOGNIZED_DEEP_LINK, unhandledDeepLinks);
actionMap.set(Actions.TELL_FACT, tellFact);
actionMap.set(Actions.TELL_CAT_FACT, tellCatFact);

/**
 * The entry point to handle a http request
 * @param {Request} request An Express like Request object of the HTTP request
 * @param {Response} response An Express like Response object to send back data
 */
const factsAboutGoogle = functions.https.onRequest((request, response) => {
  const app = new ApiAiApp({ request, response });
  console.log(`Request headers: ${JSON.stringify(request.headers)}`);
  console.log(`Request body: ${JSON.stringify(request.body)}`);
  app.handleRequest(actionMap);
});

module.exports = {
  factsAboutGoogle
};
