import {Platform} from 'react-native';

export const checker_key = "382aadc1f621ff2c36af71ad7137d1257e85abbecc23288a5a35bbb2b0846350";
const subscriptionSkus = Platform.select({
  ios: [
    'com.salesscriptor.oneweekfreetrial',
    'com.salesscriptor.annualsubscription',
    'com.salesscriptor.onemonthsubscription',
  ],
  default: [],
});

const productSkus = Platform.select({
  ios: [
    'com.salesscriptor.oneweekfreetrial',
    'com.salesscriptor.annualsubscription',
    'com.salesscriptor.onemonthsubscription',
  ],
  default: [],
});

export const isIos = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const errorLog = ({message, error}) => {
  console.error('An error happened', message, error);
};

export const constantSkus = {
  productSkus,
  subscriptionSkus,
};

export function getFormattedDate(date) {
  let dt = new Date(date);
  return `${dt.getFullYear().toString().padStart(4, '0')}-${(dt.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')} ${dt
    .getHours()
    .toString()
    .padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;
}
export function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getExpiryDate(Days) {
  var date = new Date();
  // eslint-disable-next-line radix
  var newData = addDays(date, parseInt(Days));
  return formatDate(newData);
}
