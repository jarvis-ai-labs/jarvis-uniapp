export function formatDate(strDate, strFormat = 'yyyy/MM/dd HH:mm:ss') {
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

export function formatDuration(ms) {
  let ss = ms % 1000;
  ms = (ms - ss) / 1000;
  let s = ms % 60;
  ms = (ms - s) / 60;
  let m = ms % 60;
  ms = (ms - m) / 60;
  let h = ms,
    v = '';
  if (h > 0) v += (h < 10 ? '0' : '') + h + ':';
  v += (m < 10 ? '0' : '') + m + ':';
  v += (s < 10 ? '0' : '') + s;
  return v;
}

export function formatFileName(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `Jarvis-录音-${year}年${month}月${day}日${hour}时${minute}分${second}秒`;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function handleCopy(value) {
  const dummy = document.createElement('textarea');
  document.body.appendChild(dummy);
  dummy.value = value;
  dummy.select();
  document.execCommand('Copy');
  document.body.removeChild(dummy);
}

export function getAudioToTextExample() {
  return '张伟：大家早上好，感谢大家准时参加今天的会议。今天的议程主要是总结第三季度的销售情况，并讨论第四季度的目标。我们先从李娜开始，请她汇报一下第三季度的销售数据。李娜：好的，谢谢张总。第三季度我们的总销售额达到了1200万元，完成了季度目标的95%。相比第二季度增长了8%，但离预期目标还有一定差距。主要增长点来自华东和华南地区，分别增长了12%和15%。不过，华北地区的销售额下降了5%，主要原因是市场竞争加剧和客户流失。张伟：华北地区的问题需要重点关注。王强，市场部有没有针对华北地区的推广计划？王强：是的，我们已经在制定新的推广策略，计划在第四季度加大线上广告投放，同时联合当地渠道商做一些线下活动。预计从11月开始实施，目标是提升品牌曝光度和客户转化率。陈丽：我补充一点，从财务数据来看，第三季度的利润率有所下降，主要是由于促销活动增加了成本。建议在第四季度优化促销策略，避免过度降价。张伟：很好的建议。李娜，你们销售团队在第四季度的目标是多少？李娜：我们计划第四季度销售额达到1500万元，同比增长25%。为了实现这一目标，我们会加强客户关系管理，同时推出新的销售激励政策。刘洋：我这边也有一些客户反馈，建议我们优化售后服务的响应速度，这可能会对客户满意度和复购率有帮助。张伟：这个建议很好，会后我们可以讨论具体的改进方案。最后，大家还有什么补充吗？王强：我建议在第四季度增加一次全员培训，重点提升销售团队的产品知识和谈判技巧。张伟：同意，这件事由李娜和王强共同负责。今天的会议就到这里，感谢大家的参与。我们下周再开一次会，细化第四季度的行动计划。散会！';
}
