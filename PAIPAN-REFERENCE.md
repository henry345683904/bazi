# Paipan reference audit

Reference: https://zydx.top/paipan.php, observed 2026-10-11.
Synthetic sample: male, Gregorian 2026-10-11 12:24, UTC+8, clock time.

Verified matches: pillars 丙午 戊戌 戊午 戊午; lunar 2026-09-02;
fetal pillar 己丑; life palace 辛丑; nine luck pillars 己亥 through 丁未.
The UI now includes both calendars, surrounding Jie boundaries, zodiac,
fetal and life palaces, nine luck cycles and ten small luck years.

Calendar dependency: lunar-javascript 1.7.7, bundled under vendor with its MIT license.
Solar term timestamps use UTC+8 library results converted to the selected offset.
Luck start now uses symbolic years/months/days/hours rather than multiplying
a fractional age by an average Gregorian year. Month-end dates are clamped.

Known differences: the reference reports 2026 L立冬 as November 7 19:29;
the calendar library reports November 7 17:52:05. Consequently, the reference
reports first luck start November 16, 2035 while this implementation reports
November 7, 2035. No single-sample date overrides are installed.
Reference-only stars, name-element analysis and bone-weight verses have not
been independently verified or imported. This is not a claim of full parity
with the reference site's proprietary rules or of verified predictive accuracy.
