module.exports = {
  priceFormater: (price, currency = 'R$') => {
    const splitedPrice = price.split('.')
    return `${currency}${splitedPrice[0]},${splitedPrice[1].slice(0,2)}`
  },
  getRemoteData: (url) => {
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
  }
}