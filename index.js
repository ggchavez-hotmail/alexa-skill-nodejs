/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

// i18n dependencies. i18n is the main module, sprintf allows us to include variables with '%s'.
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');

// We create a language strings object containing all of our strings. 
// The keys for each string will then be referenced in our code
// e.g. requestAttributes.t('WELCOME_MSG')
const languageStrings = {
  es:{
    translation: {
      WELCOME_MSG:  'Hola, para detalle de comandos, intente: "Ayuda."',
      REGISTER_MSG_PING: 'Intentando PING a %s, resultado %s.',
      REGISTER_MSG_MOVIE: 'Pelicula: %s, sinopsis: %s.',
      REGISTER_MSG_TV: 'Serie: %s, sinopsis: %s.',
      REGISTER_MSG_HOST: 'Datos del HOST, IP: %s, país: %s, región: %s, latitud: %s, longitud: %s.',
      REPROMPT_MSG:  '¿Desea algo más?',
      HELP_MSG: 'Actualmente la skill permite. Verificar latencia desde su dispositivo, intente: "Hacer ping". Obtener una recomendación aleatoria de peliculas, intente: "Recomendar pelicula". Obtener una recomendación aleatoria de series de TV, intente: "Recomendar serie". Obtener datos del HOST ip, pais, región, latitud, longitud ; intente: "Información del host"',
      GOODBYE_MSG: 'Hasta luego!',
      REFLECTOR_MSG: 'Acabas de activar %s',
      FALLBACK_MSG: 'Lo siento, no se nada sobre eso. Por favor inténtalo otra vez.',
      ERROR_MSG: 'Lo siento, ha habido un problema. Por favor inténtalo otra vez.'
    }
  }
}

//Opciones para utilizar funcion ping
var https = require('https');
var http = require("http");

function httpGetRecommendation(formato) {
  return new Promise(((resolve, reject) => {
    var options = {
        host: 'api.themoviedb.org',
        port: 443,
        path: '/3/discover/' + formato +'?api_key=' + 'ID_API_KEY',
        method: 'GET',
    };
    
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
}

function ping(url, port) {
  var promise = new Promise(function (resolve, reject) {
    var result;
    var options = { host: url, port: port || 80, path: '/' };
    var start = Date.now();
    var pingRequest = http.request(options, function () {
      result = Date.now() - start;
      resolve(result);
      pingRequest.abort();
    });
    pingRequest.on("error", function () {
      result = -1;
      reject(result);
      pingRequest.abort();
    });
    pingRequest.write("");
    pingRequest.end();
  });
  return promise;
}

function httpGetInfoHost() {
  return new Promise(((resolve, reject) => {
    var options = {
        host: 'freegeoip.app',
        port: 443,
        path: '/json/',
        method: 'GET',
    };
    
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechText = requestAttributes.t('WELCOME_MSG');
        
        const speechTextRepromt = requestAttributes.t('REPROMPT_MSG');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechTextRepromt)
            .getResponse();
    }
};

const ToolPingIntentHandler = {
  canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ToolPingIntent';
  },
  async handle(handlerInput) {
    const {attributesManager} = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    const intent = handlerInput.requestEnvelope.request.intent;
    
    const hostName = intent.slots.hostName.value || 'google.com';
    console.log(hostName);
    
    const response = await ping(hostName, 80)
        .then(time => `OK, tiempo de respuesta: ${time} milisegundos`)
        .catch(error => `ERROR, fallo intento: ${error}`);
    
    console.log(response);

    const speechText = requestAttributes.t('REGISTER_MSG_PING', hostName, response); // we'll save these values later
    
    const speechTextRepromt = requestAttributes.t('REPROMPT_MSG');

    return handlerInput.responseBuilder
        .speak(speechText + speechTextRepromt)
        .reprompt(speechTextRepromt)
        .getResponse();
  },
};

const MovieRecommendIntentHandler = {
  canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'MovieRecommendIntent';
  },
  async handle(handlerInput) {
      
    const {attributesManager} = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    
    const response = await httpGetRecommendation('movie');
    
    const results = response.results;
    
    const item = Math.floor(Math.random() * results.length);
    
    const pelicula = results[item].original_title;
    const sinopsis = results[item].overview;
    
    /*
    //esta forma funciona para recorrer
    let pelicula = '';
    for(let i=0;i<results.length;i++){
        pelicula =  results[i].original_title;
    }*/
    
    const speechText = requestAttributes.t('REGISTER_MSG_MOVIE', pelicula, sinopsis); 

    const speechTextRepromt = requestAttributes.t('REPROMPT_MSG');

    return handlerInput.responseBuilder
        .speak(speechText + speechTextRepromt)
        .reprompt(speechTextRepromt)
        .getResponse();
  },
};

const TVRecommendIntentHandler = {
  canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'TVRecommendIntent';
  },
  async handle(handlerInput) {
      
    const {attributesManager} = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    
    const response = await httpGetRecommendation('tv');
    
    const results = response.results;
    
    const item = Math.floor(Math.random() * results.length);
    
    const serie = results[item].original_name;
    const sinopsis = results[item].overview;
    
    /*
    //esta forma funciona para recorrer
    let pelicula = '';
    for(let i=0;i<results.length;i++){
        pelicula =  results[i].original_title;
    }*/
    
    const speechText = requestAttributes.t('REGISTER_MSG_TV', serie, sinopsis); 

    const speechTextRepromt = requestAttributes.t('REPROMPT_MSG');
    
    return handlerInput.responseBuilder
        .speak(speechText + speechTextRepromt)
        .reprompt(speechTextRepromt)
        .getResponse();
  },
};

const HostInfoIntentHandler = {
  canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HostInfoIntent';
  },
  async handle(handlerInput) {
      
    const {attributesManager} = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();
    
    const response = await httpGetInfoHost();
    
    const ip = response.ip;
    const country_name = response.country_name;
    const region_name = response.region_name;
    const latitude = response.latitude;
    const longitude = response.longitude;
    
    /*
    //esta forma funciona para recorrer
    let pelicula = '';
    for(let i=0;i<results.length;i++){
        pelicula =  results[i].original_title;
    }*/
    
    const speechText = requestAttributes.t('REGISTER_MSG_HOST', ip, country_name, region_name, latitude, longitude); 

    const speechTextRepromt = requestAttributes.t('REPROMPT_MSG');
    
    return handlerInput.responseBuilder
        .speak(speechText + speechTextRepromt)
        .reprompt(speechTextRepromt)
        .getResponse();
  },
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechText = requestAttributes.t('GOODBYE_MSG');

        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechText = requestAttributes.t('HELP_MSG');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechText = requestAttributes.t('GOODBYE_MSG');

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechText = requestAttributes.t('FALLBACK_MSG');

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = requestAttributes.t('REFLECTOR_MSG', intentName);

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const {attributesManager} = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        const speechText = requestAttributes.t('ERROR_MSG');

        console.log(`~~~~ Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
    }
};

// This response interceptor will log all outgoing responses of this lambda
const LoggingResponseInterceptor = {
    process(handlerInput, response) {
      console.log(`Outgoing response: ${JSON.stringify(response)}`);
    }
};

// This request interceptor will bind a translation function 't' to the requestAttributes.
const LocalizationRequestInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: handlerInput.requestEnvelope.request.locale,
      overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
      resources: languageStrings,
      returnObjects: true
    });
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function (...args) {
      return localizationClient.t(...args);
    }
  }
};


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ToolPingIntentHandler,
        MovieRecommendIntentHandler,
        TVRecommendIntentHandler,
        HostInfoIntentHandler,
        NoIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LocalizationRequestInterceptor,
        LoggingRequestInterceptor)
    .addResponseInterceptors(
        LoggingResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
