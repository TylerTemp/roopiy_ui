interface Placeholders {
    [key: string]: string
}

export const Format = (template: string, placeholders: Placeholders): string => {
    let s = template;
    Object.keys(placeholders).forEach((propertyName) => {
        if (Object.prototype.hasOwnProperty.call(placeholders, propertyName)) {
            const re = new RegExp(`{${propertyName}}`, 'gm');
            s = s.replace(re, placeholders[propertyName]);
        }
    });
    return s;
};