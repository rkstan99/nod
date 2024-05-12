const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');
const { replacePlaceholders } = require('./placeholders');

const sendAsImage = false; // Ensure this is set to false for now
const sendAttachment = true;
const hideFromMail = false;

async function sendEmails() {
    try {
        // Read available config files
        const configFiles = ['config.json', 'config1.json', 'config2.json'];

        // Read recipient list
        const recipients = (await fs.readFile('list.txt', 'utf8')).trim().split('\n');

        printHeader();

        let emailCount = 0;
        const cidMappings = require('./cids.json'); // Load CID mappings once

        for (const recipient of recipients) {
            try {
                // Randomly select a config file
                const randomConfigFile = configFiles[Math.floor(Math.random() * configFiles.length)];
                console.log(`Using config file: ${randomConfigFile}`);
                const config = JSON.parse(await fs.readFile(randomConfigFile, 'utf8'));

                if (!config.enableCustomHeaders || !config.enableHTMLImage || !config.enableAttachment) {
                    throw new Error('Custom headers, HTML image, or attachment is not enabled in config.');
                }

                const mailOptions = {
                    subject: replacePlaceholders('Good Morning ##victimemail##', [recipient]),
                    from: hideFromMail ? `"##num3##"` : replacePlaceholders('"##num3##" <info@schreinerei-spuck.de>', [recipient]),
                    to: recipient,
                };

                if (config.customHeaders) {
                    mailOptions.headers = config.customHeaders;
                }

                if (sendAsImage && config.enableHTMLImage) {
                    // Generate image from HTML content
                    const imageBuffer = await generateImageFromHTML('letter.html', recipient);
                    mailOptions.html = `<img src="data:image/png;base64,${imageBuffer}" alt="Letter Image">`; // Embed image in email
                } else {
                    // Use plain HTML content with placeholders replaced
                    const letterContent = await fs.readFile('letter.html', 'utf8');
                    mailOptions.html = replacePlaceholders(letterContent, [recipient]);
                }

                // Attach images referenced in letter.html using CID
                const attachments = [];
                for (const cid in cidMappings) {
                    attachments.push({
                        filename: `${cid}.png`,
                        path: cidMappings[cid],
                        cid: cid,
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
                        disposition: 'attachment',
                    };
                    mailOptions.attachments.push(attachment);
                }

                // Set message importance (high, normal, low)
                mailOptions.priority = 'high'; // Set priority as needed ('high', 'normal', 'low')

                // Create email transporter using SMTP settings from config
                const emailTransporter = nodemailer.createTransport(config.smtp);

                // Send the email using the configured transporter and mail options
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

async function generateImageFromHTML(htmlFilePath, recipient) {
    try {
        const letterContent = await fs.readFile(htmlFilePath, 'utf8');
        const processedHtmlContent = replacePlaceholders(letterContent, [recipient]);

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
