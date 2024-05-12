// Helper function to generate a random number with a specified number of digits
function generateRandomNumber(count) {
    return Math.floor(Math.random() * Math.pow(10, count)).toString().padStart(count, '0');
}

// Helper function to generate a random string of specified length and type ('lower' or 'upper')
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

// Main function to replace placeholders in content based on recipient information
function replacePlaceholders(content, recipient) {
    recipient = Array.isArray(recipient) ? recipient : [recipient];

    if (recipient.length === 0) {
        console.error('Recipient array is empty.');
        return content;
    }

    recipient.forEach((email, index) => {
        const domain = email.split('@')[1];
        const domainParts = domain.split('.');
        const name = email.split('@')[0]; // Extract name before '@'
        const placeholders = {
            '##date1##': new Date().toLocaleString('en-US', { timeZone: 'UTC' }),
            '##date##': new Date().toISOString(),
            '##date2##': new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            '##victimemail##': email,
            '##victimname##': name.charAt(0).toUpperCase() + name.slice(1), // Format name (capitalize first letter)
            '##victimdomain##': domain,
            '##victimdomain1##': domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1),
            '##victimdomain2##': domainParts[0].toUpperCase(),
            '##victimdomain3##': domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1) + '.' + domainParts[1].toUpperCase(),
            '##victimdomain4##': domainParts[0].toLowerCase(),
            '##victimdomainlogo##': (domain.includes('microsoft.com') ? 'Microsoft Logo' : 'Path/URL to Default Logo'),
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
