/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const priceFormater = ( price, currency = 'R$' ) => {
  const splitedPrice = price.split('.')
  return `${currency}${splitedPrice[0]},${splitedPrice[1].slice(0,2)}`
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle(handlerInput) {
    const speechText = "Olá, o que deseja saber?"

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
}

const GetRemoteDataHandler = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetRemoteDataIntent');
  },
  async handle(handlerInput) {
    const speechText = "Olá, o que deseja saber?"
    let outputSpeech = 'Ops, desculpe algo deu errado.';

    const intentStocks = handlerInput.requestEnvelope.request.intent.slots.stocks
    
    if(intentStocks.resolutions) {
      const resolutionsPerAuthority = intentStocks.resolutions.resolutionsPerAuthority[0]
      const stockVoiceSize = intentStocks.value.length

      if(stockVoiceSize >= 5 && resolutionsPerAuthority.values) {
        const stockCode = resolutionsPerAuthority.values[0].value.id
        await getRemoteData(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${stockCode}.SA&interval=1min&apikey=J3FQEEUK9ESR4BSI`)
          .then((response) => {
            const data = JSON.parse(response);
            const lastUpdateKey = data["Meta Data"]["3. Last Refreshed"]
            const priceClose = data["Time Series (1min)"][lastUpdateKey]["4. close"]

            outputSpeech = `Cotação de ${stockCode} ${priceFormater(priceClose)}`;
          })
          .catch((err) => {
            outputSpeech = `ERRO API`;
          });
      }
      else {
        outputSpeech = `Desculpe não encontrei a ação ${intentStocks.value}.`
      }
    } else {
      outputSpeech = `Desculpe não entendi este comando.`
    }

    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Você pode perguntar a cotação ações.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Até mais!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Desculpe, não consegui entender o comando. Por favor diga novamente.')
      .reprompt('Desculpe, não consegui entender o comando. Por favor diga novamente.')
      .getResponse();
  },
};

const getRemoteData = function (url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http');
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed with status code: ' + response.statusCode));
      }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', (err) => reject(err))
  })
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetRemoteDataHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

