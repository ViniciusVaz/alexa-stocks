const helpers = require('../utils/helpers')
const priceFormater = helpers.priceFormater
const getRemoteData = helpers.getRemoteData

module.exports = {
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

            outputSpeech = `Cotação de ${stockCode} ${priceFormater(priceClose)}.`;
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