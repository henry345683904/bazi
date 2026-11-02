const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const html = fs.readFileSync('bazi-fortune-optimized.html', 'utf8');
const source = html.slice(html.indexOf('    const qimenDisplayOrder'), html.indexOf('    function knowledgeText'));
const lunar = {};
vm.createContext(lunar);
vm.runInContext(fs.readFileSync('vendor/lunar-1.7.7.js', 'utf8'), lunar);
const context = { console, Date, stems: [...'甲乙丙丁戊己庚辛壬癸'], branches: [...'子丑寅卯辰巳午未申酉戌亥'], pad: n => String(n).padStart(2, '0') };
context.solarTermDate = (year, index) => {
  const names = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
  let t = lunar.Solar.fromYmd(year, 6, 1).getLunar().getJieQiTable()[names[index]];
  if (t.getYear() !== year) t = lunar.Solar.fromYmd(year + 1, 6, 1).getLunar().getJieQiTable()[names[index]];
  return new Date(t.getYear(), t.getMonth()-1, t.getDay(), t.getHour(), t.getMinute(), t.getSecond());
};
vm.createContext(context);
vm.runInContext(html.match(/    const solarTermNames = .*;/)[0], context);
vm.runInContext(source, context);
vm.runInContext(`
  qimenPillars = () => ({year:{text:'丙午'},month:{text:'戊戌'},day:{index:16,stem:'庚',branch:'辰'},hour:{index:18,stem:'壬',branch:'午'}});
  qimenPalaceDailyPredictions = () => ['测试'];
  qimenPalaceProPredictions = () => [];
  qimenCellScore = () => 0;
  qimenRoleAnalysis = () => ({});
`, context);
const chart = vm.runInContext('buildQimenChart(new Date(2026,10,2,12,12))', context);
assert.equal(chart.ju, 5);
assert.equal(chart.dun, '阴遁');
assert.equal(chart.chiefCell.palace, 1);
assert.equal(chart.chiefCell.star.name, '天辅');
const expected = {
  4:['天柱','生门','玄武','丙','己'],9:['天心','伤门','白虎','乙','癸'],2:['天蓬','杜门','六合','壬','辛'],
  3:['天芮','休门','九地','辛','庚'],7:['天任','景门','太阴','丁','丙'],
  8:['天英','开门','九天','癸','丁'],1:['天辅','惊门','值符','己','壬'],6:['天冲','死门','腾蛇','庚','乙']
};
for (const [palace, values] of Object.entries(expected)) {
  const cell = chart.cells.find(c => c.palace === Number(palace));
  assert.deepEqual([cell.star.name,cell.door.name,cell.god.name,cell.skyStem,cell.earthStem], values, `宫${palace}`);
}
console.log('Screenshot fixture: yin 5, Tianfu palace 1; all 8 outer palaces match stars/doors/gods/sky/earth.');
context.window = lunar;
context.ganzhi = i => ({index:i,stem:context.stems[i%10],branch:context.branches[i%12],text:context.stems[i%10]+context.branches[i%12]});
const pillarsFunction = html.match(/    function qimenPillars\(date\) \{[\s\S]*?(?=    function qimenYinYangDun)/)[0];
vm.runInContext(pillarsFunction, context);
const real = vm.runInContext('buildQimenChart(new Date(2026,10,2,12,12))', context);
assert.deepEqual(Object.values(real.pillars).map(p => p.text), ['丙午','戊戌','庚辰','壬午']);
assert.equal(real.ju,5);
assert.equal(real.chiefCell.palace,1);
console.log('Actual lunar-library pillars and fixed-time chart also pass.');
