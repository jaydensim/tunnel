import { BrowserDetectInfo } from 'browser-detect/dist/types/browser-detect.interface'
import QRCode from 'qrcode'
import { Rabbit } from 'crypto-js'

export function QRencodeData (sharedID: string, browserInfo: BrowserDetectInfo|null, encryptionbtoa: string, callback: any, faliure: any) {
  const path: string = window.location.origin + window.location.pathname
  const jsonencoded = JSON.stringify({
    v: 2,
    i: sharedID,
    b: browserInfo!.name,
    o: browserInfo!.os,
    m: browserInfo!.mobile,
    e: encryptionbtoa
  })
  try {
    const rabbitOutput = Rabbit.encrypt(jsonencoded, window.location.origin)
    const qrstring:string = path + '#tunnelv2' + rabbitOutput
    QRCode.toString(qrstring, { type: 'svg' }, function (err: any, string:string) {
      if (err) throw err
      callback(string, qrstring)
    })
  } catch {
    faliure(304)
  }
}

export function QRdecodeData (qrdata: string, callback: any, faliure: any) {
  const path: string = window.location.origin + window.location.pathname
  const rabbitInput = qrdata.replace(path + '#tunnelv2', '')
  try {
    const result = decryptedToString(Rabbit.decrypt(rabbitInput, window.location.origin))
    const out = JSON.parse(result)
    if (out.v === 2) {
      // alert('Rabbit Decryption succeded: \nID: ' + out.i + '\nBrowser: ' + out.b + '\nOS: ' + out.o + '\nIs Mobile: ' + out.m + '\nEncryption seed: ' + out.e)
      callback(out)
    } else {
      faliure(303)
    }
  } catch {
    faliure(306)
  }
}

function decryptedToString (decrypt: any) {
  const chars = []
  const decryptedArr = decrypt.toString().split('')
  while (decryptedArr.length !== 0) {
    chars.push(String.fromCharCode(parseInt(decryptedArr.splice(0, 2).join(''), 16)))
  }
  return chars.join('')
}
