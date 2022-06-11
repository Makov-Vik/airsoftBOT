module.exports = {
  acceptDeclineOptions: {
     reply_markup: JSON.stringify({
         inline_keyboard: [
             [{text: 'APPROVE', callback_data: '0'}, {text: 'DECLINE', callback_data: '1' }],
         ]
     })
 },

//  againOptions: {
//      reply_markup: JSON.stringify({
//          inline_keyboard: [
//              [{text: 'Играть еще раз', callback_data: '/again'}],
//          ]
//      })
//  }
}