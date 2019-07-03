const helpers = require('../utils/helpers')
const priceFormater = helpers.priceFormater
const getRemoteData = helpers.getRemoteData

const convertTextToNumber = (text) => {
  if(text === "um" || text === "one")
    return 1
  else if (text === "dois" || text === "two")
    return 2
  else if (text === "três" || text === "three")
    return 3
  else if (text === "quatro" || text === "four")
    return 4
  else if (text === "cinco" || text === "five")
    return 5
  else if (text === "seis" || text === "six")
    return 6
  else if (text === "sete" || text === "seven")
    return 7
  else if (text === "oito" || text === "eight")
    return 8
  else if (text === "nove" || text === "nine")
    return 9
  else if (text === "dez" || text === "ten")
    return 10
  else 
    return text
}

const voiceValueConvert = (value) => {
  const inArray = value.split('. ')
  const lastItem = inArray.pop()
  const lastNumber = convertTextToNumber(lastItem)

  inArray.push(lastNumber)

  return inArray.toString().replace(/\,/g,'').toUpperCase()
}

module.exports = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetRemoteDataIntent');
  },
  async handle(handlerInput) {
    const speechText = "Olá, me diga o código da ação que deseja saber a cotação."
    let outputSpeech = 'Ops, desculpe algo deu errado.';
    let waitAnswer = false

    const intentStocks = handlerInput.requestEnvelope.request.intent.slots.stocks
    
    if(intentStocks.resolutions) {
      const resolutionsPerAuthority = intentStocks.resolutions.resolutionsPerAuthority[0]
      const stockVoiceSize = intentStocks.value.length

      if(stockVoiceSize >= 5 && resolutionsPerAuthority.values) {
        const formattedVoiceValue = voiceValueConvert(intentStocks.value)
        const matchFirstValue = formattedVoiceValue === resolutionsPerAuthority.values[0].value.name
        const machLength = resolutionsPerAuthority.values.length

        // if(machLength > 1 && !matchFirstValue) {
        //   const stockCode1 = resolutionsPerAuthority.values[0].value.id
        //   const stockCode2 = resolutionsPerAuthority.values[1].value.id
        //   waitAnswer = true

        //   outputSpeech = `Você deseja saber a cotação de <say-as interpret-as="characters">${stockCode1}</say-as> ou <say-as interpret-as="characters">${stockCode2}</say-as>?`;
        // }
        // else {
          const stockCode = resolutionsPerAuthority.values[0].value.id

          await getRemoteData(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${stockCode}.SA&interval=15min&apikey=J3FQEEUK9ESR4BSI`)
            .then((response) => {
              const data = JSON.parse(response);
              const lastUpdateKey = data["Meta Data"]["3. Last Refreshed"]
              const priceClose = data["Time Series (15min)"][lastUpdateKey]["4. close"]

              outputSpeech = `A cotação de <say-as interpret-as="characters">${stockCode}</say-as> é ${priceFormater(priceClose)}.`;
            })
            .catch((err) => {
              outputSpeech = `Desculpe não encontrei a ação`;
            });
        // }
      }
      else {
        outputSpeech = `Desculpe não encontrei a ação <say-as interpret-as="characters">${intentStocks.value}.</say-as>`
      }
    } else {
      outputSpeech = `Desculpe não entendi este comando.`
    }
    // if(waitAnswer) {
    //   return handlerInput.responseBuilder
    //     .speak(outputSpeech)
    //     .reprompt(speechText)
    //     .getResponse();
    // } else {
      return handlerInput.responseBuilder
        .speak(outputSpeech)
        // .reprompt(speechText)
        .getResponse();
    // }
  },
};