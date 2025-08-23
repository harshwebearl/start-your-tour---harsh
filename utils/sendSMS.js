// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure

require('dotenv').config();

const accountSid = process.env._TWILIO_ACCOUNT_SID;
const authToken = process.env._TWILIO_AUTH_TOKEN;
// const authToken = "[Redacted]";
const client = require("twilio")(accountSid, authToken);

const sendSMS = async (isdCode, toPhone, msgBody) => {
  return await client.messages
    .create({
      to: `${isdCode || "+91"}${toPhone}`,
      body: `${msgBody}`,
      messagingServiceSid: process.env._TWILIO_AUTH_MESSAGING_SERVICES_SID
    })
    .then((message) => {
      // console.log(1, message.sid, message);
      return message;
    })
    .catch((err) => console.log("sendSMS()", err));
};

module.exports = {
  client,
  sendSMS
};
