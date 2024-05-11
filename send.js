// send.js

const { sendEmails } = require('./config');

// Call the sendEmails function
sendEmails()
  .then(() => {
    console.log('All emails sent successfully!');
  })
  .catch((error) => {
    console.error('An error occurred while sending emails:', error);
  });
