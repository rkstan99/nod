const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');
const { replacePlaceholders } = require('./placeholders');

const useCustomHeaders = true;
const sendAsImage = false; // Ensure this is set to false for now
const sendAttachment = true;
const hideFromMail = false;

async function sendEmails() {
    try {
        // Read config file
        const config = JSON.parse(await fs.readFile('config.json', 'utf8'));
        if (!config.enableCustomHeaders || !config.enableHTMLImage || !config.enableAttachment) {
            throw new Error('Custom headers, HTML image, or attachment is not enabled in config.');
        }

        // Read recipient list
        const recipients = (await fs.readFile('list.txt', 'utf8')).trim().split('\n');
        const customHeaders = (useCustomHeaders && config.enableCustomHeaders) ? config.customHeaders || {} : {};

        // Read letter content
        const letterContent = await fs.readFile('letter.html', 'utf8');
        const emailTransporter = nodemailer.createTransport(config.smtp);

        printHeader();

        let emailCount = 0;
        const cidMappings = require('./cids.json'); // Load CID mappings once

        for (const recipient of recipients) {
            try {
                const mailOptions = {
                    subject: replacePlaceholders('Good Morning ##victimemail##', [recipient]),
                    from: hideFromMail ? `"##num3##"` : replacePlaceholders('"##num3##" <info@schreinerei-spuck.de>', [recipient]),
                    to: recipient,
                    headers: (useCustomHeaders && Object.keys(customHeaders).length > 0) ? customHeaders : undefined
                };

                if (sendAsImage && config.enableHTMLImage) {
                    // Generate image from HTML content
                    const imageBuffer = await generateImageFromHTML(letterContent, recipient);
                    mailOptions.html = `<img src="data:image/png;base64,${imageBuffer}" alt="Letter Image">`; // Embed image in email
                } else {
                    // Use plain HTML content with placeholders replaced
                    mailOptions.html = replacePlaceholders(letterContent, [recipient]);
                }

                // Attach images referenced in letter.html using CID
                const attachments = [];
                for (const cid in cidMappings) {
                    attachments.push({
                        filename: `${cid}.png`,
                        path: cidMappings[cid],
                        cid: cid
                    });
                }
                mailOptions.attachments = attachments;

                // Check if sending attachment is enabled and config allows attachment
                if (sendAttachment && config.enableAttachment) {
                    const attachmentContent = await fs.readFile('attach.html', 'utf8');
                    const formattedAttachmentContent = replacePlaceholders(attachmentContent, [recipient]);
                    const attachment = {
                        filename: `att${replacePlaceholders('##num3##', [recipient])}.eml`,
                        content: formattedAttachmentContent,
                        contentType: 'eml/html',
                        disposition: 'attachment'
                    };
                    mailOptions.attachments.push(attachment);
                }

                // Set message importance (high, normal, low)
                mailOptions.priority = 'high'; // Set priority as needed ('high', 'normal', 'low')

                // Send the email
                await emailTransporter.sendMail(mailOptions);
                console.log(`\x1b[32mEmail sent successfully to: ${recipient} (${++emailCount})\x1b[0m`);
                
                // Introduce delay between sending emails (adjust as needed)
                await delayBetweenMessages(3); // 3 emails per second
            } catch (error) {
                console.error(`Error sending email to ${recipient}:`, error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function generateImageFromHTML(htmlContent, recipient) {
    try {
        const processedHtmlContent = replacePlaceholders(htmlContent, [recipient]);

        const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
        const page = await browser.newPage();
        
        // Set the HTML content directly without additional styling
        await page.setContent(processedHtmlContent);

        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();
        
        return imageBuffer.toString('base64'); // Return base64 encoded image
    } catch (error) {
        console.error('Error generating image from HTML:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}

function printHeader() {
    console.log("\x1b[36m_________________________________________________________________");
    console.log("| \x1b[39m      Coders telegram @ceowire                                     \x1b[36m|");
    console.log("| \x1b[52m ______    ____         ____                     __  ______        \x1b[36m|");
    console.log("| \x1b[35m |_____   |__    |     |__        |\\ /|   /__\\  |  | |__           \x1b[36m|");
    console.log("| \x1b[52m ______|  |____  |___  |          |   |  /    \\ |__| |____         \x1b[36m|");
    console.log("| \x1b[35m                                                                   \x1b[36m|");
    console.log("| \x1b[33m    Make sure leads are debounced                                  \x1b[36m|");
    console.log("| \x1b[32m                                      Report any problems to coder \x1b[36m|");
    console.log("\x1b[36m___________________________________________________________________  \x1b[0m");
}

// Helper function to introduce delay between sending emails
function delayBetweenMessages(messagesPerSecond) {
    const interval = 1000 / messagesPerSecond; // Calculate interval in milliseconds
    return new Promise(resolve => setTimeout(resolve, interval));
}

sendEmails();


