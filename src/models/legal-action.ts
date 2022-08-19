import { Schema, model, Document } from 'mongoose';

export const LegalActionList: string[] = [
  '5f7505cf49bb0b0d3a6e334e',
  '5f519caf4e75c555c7862d35',
  '5fa5d0df04d311628f04fac3',
  '5f77b1ea1d55794357f06ad9',
  '6053c2bcdb1a2667bc3aff57',
  '5f52fde1df9bd43fe8c37ff6',
  '5f52fc13da0d013fdd6b1ec9',
  '5f52fe74da0d013fdd6b1edd',
  '5f52fed7da0d013fdd6b1eea',
  '5e4f18450734cc0750b1a83c',
  '5f57c8d4a1009c67a9013dce',
  '6042901d3b80647783eef439',
]

export interface ILegalAction extends Document {
  password: string;
  created: Date;
}

export const legalActionSchema = new Schema({
  password: String,
  created: Date,
});

const LegalAction = model<ILegalAction>('legal-actions', legalActionSchema);

export default LegalAction;
