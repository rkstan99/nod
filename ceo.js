const fs = require('fs');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');
const { replacePlaceholders } = require('./placeholders');

const embedLink = true;
const useCustomHeaders = false;
const sendAsImage = true; //letter to image works on this code
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

        // Read cid mappings from cids.json
        const cidMappings = require('./cids.json');

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

                if (sendAsImage && config.enableHTMLImage) {
                    const { imageBuffer, link } = await generateImage(replacePlaceholders(letterContent, [recipient]));

                    if (embedLink && link) {
                        // Create attachments array based on cidMappings
                        const attachments = Object.keys(cidMappings).map(cid => ({
                            filename: `${cid}.png`,
                            path: cidMappings[cid],
                            cid: cid
                        }));
                        mailOptions.html = `<a href="${link}" style="text-decoration: none;"><img src="cid:${attachments[0].cid}" style="display: block; border: 0; outline: none;"></a>`;
                        mailOptions.attachments = attachments;
                    } else {
                        mailOptions.html = `<img src="cid:letter_image" style="display: block; border: 0; outline: none;">`;
                        mailOptions.attachments = [{ filename: 'letter_image.png', content: imageBuffer, cid: 'letter_image' }];
                    }
                } else {
                    mailOptions.html = replacePlaceholders(letterContent, [recipient]);
                }

                if (sendAttachment && config.enableAttachment) {
                    let attachmentContent = fs.readFileSync('attach.html', 'utf8');
                    attachmentContent = replacePlaceholders(attachmentContent, [recipient]);
                    const attachment = {
                        filename: `att${replacePlaceholders('##num3##', [recipient])}.eml`,
                        content: attachmentContent,
                        contentType: 'eml/html',
                        disposition: 'attachment'
                    };
                    mailOptions.attachments = mailOptions.attachments || [];
                    mailOptions.attachments.push(attachment);
                }

                await emailTransporter.sendMail(mailOptions);
                console.log(`\x1b[32mEmail sent successfully to: ${recipient} (${++emailCount})\x1b[0m`);
            } catch (error) {
                console.error(`Error sending email to ${recipient}:`, error);
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
    try {
        const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();
        return { imageBuffer, link: null }; // Return link if necessary for embedding
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

sendEmails();
