function generateRandomNumber(count) {
    return Math.floor(Math.random() * Math.pow(10, count)).toString().padStart(count, '0');
}

function generateRandomString(count, type) {
    let chars;
    if (type === 'lower') {
        chars = 'abcdefghijklmnopqrstuvwxyz';
    } else if (type === 'upper') {
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    let randomString = '';
    for (let i = 0; i < count; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString;
}

function replacePlaceholders(content, recipient) {
    recipient = Array.isArray(recipient) ? recipient : [recipient];

    if (recipient.length === 0) {
        console.error('Recipient array is empty.');
        return content;
    }

    recipient.forEach((email, index) => {
        const placeholders = {
            '##date1##': new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
            '##date##': new Date().toISOString(),
            '##victimemail##': email,
            '##victimdomain##': email.split('@')[1],
            '##victimdomain1##': email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + email.split('@')[1].split('.')[0].slice(1),
            '##victimdomain2##': email.split('@')[1].split('.')[0].toUpperCase(),
            '##victimdomainlogo##': email.split('@')[1] ? (email.split('@')[1].includes('microsoft.com') ? 'Microsoft Logo' : 'Path/URL to Default Logo') : 'Path/URL to Default Logo',
            '##link##': 'https://youtube.com'
        };

        for (let i = 1; i <= 10; i++) {
            const numPlaceholder = `##num${i}##`;
            placeholders[numPlaceholder] = generateRandomNumber(i);
        }

        for (let i = 1; i <= 10; i++) {
            const lowerStringPlaceholder = `##stringlower${i}##`;
            placeholders[lowerStringPlaceholder] = generateRandomString(i, 'lower');
            const upperStringPlaceholder = `##stringupper${i}##`;
            placeholders[upperStringPlaceholder] = generateRandomString(i, 'upper');
        }

        for (const key in placeholders) {
            if (placeholders.hasOwnProperty(key)) {
                const regex = new RegExp(key, 'g');
                content = content.replace(regex, placeholders[key]);
            }
        }
    });

    return content;
}

module.exports = {
    replacePlaceholders
};
