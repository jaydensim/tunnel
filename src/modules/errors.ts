export const errors: {[index: number]:any} = {
  300: ['Generic QRencoder error', 'Unknown Error'],
  301: ['Generic Rabbit decode error', 'Unknown Error'],
  302: ['Generic Rabbit decode error', 'Unknown Error'],
  303: ['Rabbit Transport version error', 'The QR code you\'re scanning if for another version of Tunnel. Please try reloadng the page.'],
  304: ['Generic Rabbit encode error', 'There was a problem creating the QR code. Please try reloading the page'],
  305: ['Generic Rabbit decode error', 'There was a problem decoding the QR code. Please try reloading the page'],
  306: ['URL path mismatch', "The QR code you're scanning seems to be from a channel that isnt the one you're currently on."]
}
