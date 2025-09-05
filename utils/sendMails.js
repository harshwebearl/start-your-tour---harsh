"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function sendMails(emailFrom, emailList, mailSubject, mailPlainText, mailHTML) {
  if (!emailList?.length) {
    return;
  }
  const initialValue = "";
  let commaSeperatedString = emailList.reduce((accumulator, currentValue) => {
    if (!currentValue?.email) {
      return accumulator;
    } else {
      return (accumulator = accumulator + `${currentValue?.email || ""},`);
    }
  }, initialValue);
  commaSeperatedString = commaSeperatedString.slice(0, -1);
  //   console.log(commaSeperatedString);
  //
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    // host: "smtp.ethereal.email",
    service: "gmail",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      // user: testAccount.user, // generated ethereal user
      // pass: testAccount.pass // generated ethereal password
      user: process.env._SMTP_MAIL_USER,
      pass: process.env._SMTP_MAIL_PASSWORD
    }
    // auth: {
    //   user: /* process.env.EMAIL || */ "krunal.webearl@gmail.com",
    //   pass: /* process.env.PASSWORD || */ "kmc@191020"
    // }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    // from: '"Fred Foo 👻" <foo@example.com>', // sender address
    from: emailFrom,
    // to: "bar@example.com, baz@example.com", // list of receivers
    to: commaSeperatedString,
    // to: "himanshu.webearl@gmail.com,utsav.webearl@gmail.com",
    // subject: "Hello ✔", // Subject line
    subject: mailSubject,
    // text: "Hello world?", // plain text body
    text: mailPlainText,
    // html: "<b>Hello world?</b>", // html body
    html: mailHTML
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server validation done and ready for messages.");
    }
  });

  console.log(info);

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  return nodemailer.getTestMessageUrl(info);
}

// sendMails().catch(console.error);

module.exports = {
  sendMails
};
