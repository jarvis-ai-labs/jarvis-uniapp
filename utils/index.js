export function formatDate(strDate, strFormat = 'yyyy/MM/dd HH:mm') {
  if (!strDate) return;
  if (typeof strDate == 'string') {
    strDate = new Date(strDate.replace(/-/g, '/'));
  } else if (typeof strDate == 'number') {
    strDate = new Date(strDate);
  }
  if (strDate instanceof Date) {
    const dict = {
      yyyy: strDate.getFullYear(),
      M: strDate.getMonth() + 1,
      d: strDate.getDate(),
      H: strDate.getHours(),
      m: strDate.getMinutes(),
      s: strDate.getSeconds(),
      MM: ('' + (strDate.getMonth() + 101)).substr(1),
      dd: ('' + (strDate.getDate() + 100)).substr(1),
      HH: ('' + (strDate.getHours() + 100)).substr(1),
      mm: ('' + (strDate.getMinutes() + 100)).substr(1),
      ss: ('' + (strDate.getSeconds() + 100)).substr(1)
    };
    return strFormat.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function (m) {
      return dict[m];
    });
  }
}

export function handleCopy(value) {
  const dummy = document.createElement('textarea');
  document.body.appendChild(dummy);
  dummy.value = value;
  dummy.select();
  document.execCommand('Copy');
  document.body.removeChild(dummy);
}
