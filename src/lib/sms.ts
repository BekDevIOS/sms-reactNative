const GSM_BASIC = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'.split(''),
);
const GSM_EXTENDED = new Set('^{}\\[~]|€\f'.split(''));

export function smsLength(message: string) {
  let septets = 0;
  let gsm = true;
  for (const char of message) {
    if (GSM_BASIC.has(char)) septets += 1;
    else if (GSM_EXTENDED.has(char)) septets += 2;
    else {
      gsm = false;
      break;
    }
  }
  const units = gsm ? septets : message.length;
  const single = gsm ? 160 : 70;
  const multipart = gsm ? 153 : 67;
  const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multipart);
  return {
    encoding: gsm ? 'GSM-7' : 'Unicode',
    segments,
    remaining: (segments <= 1 ? single : segments * multipart) - units,
  };
}
