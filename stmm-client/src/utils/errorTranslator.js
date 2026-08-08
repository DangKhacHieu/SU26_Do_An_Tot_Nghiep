import i18n from '../i18n';

export const translateError = (msg, fallback = '') => {
    if (!msg) return fallback;
    
    // Format: ERROR_CODE|arg0|arg1...
    if (msg.includes('|')) {
        const parts = msg.split('|');
        const code = parts[0];
        
        if (code === code.toUpperCase()) {
            const args = {};
            for (let i = 1; i < parts.length; i++) {
                args[`arg${i-1}`] = parts[i];
            }
            // Check if key exists
            const translation = i18n.t(`errors.${code}`, args);
            if (translation !== `errors.${code}`) {
                return translation;
            }
        }
    } else if (msg === msg.toUpperCase() && msg.includes('_')) {
        const translation = i18n.t(`errors.${msg}`);
        if (translation !== `errors.${msg}`) {
            return translation;
        }
    }

    return msg;
};
