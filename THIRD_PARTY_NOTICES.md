# Third-party notices

## dayjs-hijri

This package is derived from [dayjs-hijri](https://github.com/mashhadiebad/dayjs-hijri), Copyright (c) 2025 MohammadHossein MashhadiEbad. The original copyright notice and MIT license are preserved in [LICENSE](LICENSE), alongside Copyright (c) 2026 dayjs-hijri contributors and Copyright (c) 2026 SME Digital.

## Umm al-Qura calendar data

The month-start table in src/calendar/ummalqura.ts comes from [HijriDate](https://github.com/dralshehri/hijridate/blob/f6f0f4f69da8e58dc65179213822ef7b83a77dcd/src/hijridate/ummalqura.py), revision f6f0f4f69da8e58dc65179213822ef7b83a77dcd.

The rewrite corrects the legacy table's start of 1354-12 from reduced Julian day 28224 to 28223, matching that source. Historical month lengths in this published table include 28 and 31 days; do not force them into an arithmetic 29/30-day model.

MIT License

Copyright (c) Mohammed Alshehri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
