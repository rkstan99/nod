const fs = require('fs');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');
const { replacePlaceholders } = require('./placeholders');

const embedLink = true;
const useCustomHeaders = true;
const sendAsImage = true;
const sendAttachment = true;
const hideFromMail = false;

async function sendEmails() {
    try {
        const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        if (!config.enableCustomHeaders || !config.enableHTMLImage || !config.enableAttachment) {
            throw new Error('Custom headers, HTML image, or attachment is not enabled in config.');
        }

        const recipients = fs.readFileSync('list.txt', 'utf8').trim().split('\n');
        const customHeaders = (useCustomHeaders && config.enableCustomHeaders) ? config.customHeaders || {} : {};

        const letterContent = fs.readFileSync('letter.html', 'utf8');
        const emailTransporter = nodemailer.createTransport(config.smtp);

        printHeader();

        let emailCount = 0;
        for (const recipient of recipients) {
            try {
                const mailOptions = {
                    subject: replacePlaceholders('Good Morning ##victimemail##', [recipient]),
                    from: hideFromMail ? `"##num3##"` : replacePlaceholders('"##num3##" <info@schreinerei-spuck.de>', [recipient]),
                    to: recipient,
                    headers: (useCustomHeaders && Object.keys(customHeaders).length > 0) ? customHeaders : undefined
                };

                // Check if sending as image is enabled and config allows HTML image
                if (sendAsImage && config.enableHTMLImage) {
                    const { imageBuffer, link } = await generateImage(replacePlaceholders(letterContent, [recipient]));

                    if (embedLink && link) {
                        const cid = `letter_image_${Date.now()}`;
                        mailOptions.html = `<a href="${link}" style="text-decoration: none;"><img src="cid:${cid}" style="display: block; border: 0; outline: none;"></a>`;
                        mailOptions.attachments = [{ filename: `${cid}.png`, content: imageBuffer, cid: cid }];
                    } else {
                        mailOptions.html = `<img src="cid:letter_image" style="display: block; border: 0; outline: none;">`;
                        mailOptions.attachments = [{ filename: 'letter_image.png', content: imageBuffer, cid: 'letter_image' }];
                    }
                } else {
                    mailOptions.html = replacePlaceholders(letterContent, [recipient]);
                }

                // Check if sending attachment is enabled and config allows attachment
                if (sendAttachment && config.enableAttachment) {
                    let attachmentContent = fs.readFileSync('attach.html', 'utf8');
                    attachmentContent = replacePlaceholders(attachmentContent, [recipient]);
                    const attachment = { filename: `att${replacePlaceholders('##num3##', [recipient])}.eml`, content: attachmentContent, contentType: 'eml/html', disposition: 'attachment' };
                    mailOptions.attachments = mailOptions.attachments || [];
                    mailOptions.attachments.push(attachment);
                }

                // Send the email
                await emailTransporter.sendMail(mailOptions);
                console.log(`\x1b[32mEmail sent successfully to: ${recipient} (${++emailCount})\x1b[0m`);
            } catch (error) {
                console.error('Error sending email to', recipient, error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
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

async function generateImage(htmlContent) {
    const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const imageBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    return { imageBuffer, link: null }; // Adjust link if necessary
}

sendEmails();
