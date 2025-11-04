import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  constructor() { }

  // Permite encriptar y devolver una cadena en base64.
  encrypt(text: string): string {
    var Key = CryptoJS.enc.Utf8.parse('PSVJQRk9QTEpNVU1DWUZCRVFGV1VVT0='); //secret key, no cambiar ya que afecta el back.
    var IV = CryptoJS.enc.Utf8.parse('2314345645678765'); //16 digit
    var encryptedText = CryptoJS.AES.encrypt(
      text,
      Key,
      {
        keySize: 128 / 8,
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encryptedText.toString();
  }

  decrypt(encryptedText: string): string {
    var Key = CryptoJS.enc.Utf8.parse('PSVJQRk9QTEpNVU1DWUZCRVFGV1VVT0='); //secret key, no cambiar ya que afecta el back.
    var IV = CryptoJS.enc.Utf8.parse('2314345645678765'); //16 digit
    var decryptedText = CryptoJS.AES.decrypt(
      encryptedText,
      Key,
      {
        keySize: 128 / 8,
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decryptedText.toString(CryptoJS.enc.Utf8);
  }

  
}
