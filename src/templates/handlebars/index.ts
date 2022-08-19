import * as fs from 'fs';
import * as path from 'path';

function readTemplate(templateFileName: string) {
  return fs.readFileSync(path.join(__dirname, `./${templateFileName}`), 'utf8');
}

export const shareAccepted = {
  html: readTemplate('shareAccepted.hbs'),
  subject: 'You referred a new App user.',
};

export const referralActivated = {
  html: readTemplate('referralActivated.hbs'),
  subject: 'You referred an activation.',
};

export const sendSoftNodeDiscount = {
  html: readTemplate('sendSoftNodeDiscount.hbs'),
  subject: (brand: string) => `Your $100 Instant Credit for ${brand} Upgrade.`,
};

export const sendRxCard = {
  html: readTemplate('sendRxCard.hbs'),
  subject: 'Your Galvan™ Rx Discount Prescription Savings Card',
}
