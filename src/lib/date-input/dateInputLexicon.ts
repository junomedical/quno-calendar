import type { DateInputParserLanguage, DateInputLexicon } from "./dateInputTypes";

const EN: DateInputLexicon = {
  monthNames: {
    1: ["january", "jan"],
    2: ["february", "feb"],
    3: ["march", "mar"],
    4: ["april", "apr"],
    5: ["may"],
    6: ["june", "jun"],
    7: ["july", "jul"],
    8: ["august", "aug"],
    9: ["september", "sep", "sept"],
    10: ["october", "oct"],
    11: ["november", "nov"],
    12: ["december", "dec"]
  },
  today: ["today"],
  yesterday: ["yesterday"],
  tomorrow: ["tomorrow"],
  last: ["last"],
  past: ["past"],
  day: ["day"],
  days: ["days"],
  week: ["week"],
  weeks: ["weeks"],
  month: ["month"],
  months: ["months"],
  year: ["year"],
  years: ["years"],
  ago: ["ago"],
  this: ["this"],
  next: ["next"]
};

const DE: DateInputLexicon = {
  monthNames: {
    1: ["januar", "jan", "jan.", "jänner"],
    2: ["februar", "feb"],
    3: ["mär", "mar", "märz", "maerz", "mär"],
    4: ["april", "apr"],
    5: ["mai", "may"],
    6: ["juni", "jun"],
    7: ["juli", "jul"],
    8: ["august", "aug"],
    9: ["september", "sep"],
    10: ["oktober", "okt"],
    11: ["november", "nov"],
    12: ["dezember", "dez"]
  },
  today: ["heute"],
  yesterday: ["gestern"],
  tomorrow: ["morgen"],
  last: ["letzte", "letzter", "letztes"],
  past: [],
  day: ["tag", "tage", "tagen"],
  days: ["tag", "tage", "tagen"],
  week: ["woche", "wochen"],
  weeks: ["woche", "wochen"],
  month: ["monat", "monate", "monaten"],
  months: ["monat", "monate", "monaten"],
  year: ["jahr", "jahre", "jahren"],
  years: ["jahr", "jahre", "jahren"],
  ago: []
};

export const DATE_INPUT_LEXICON: Record<DateInputParserLanguage, DateInputLexicon> = { en: EN, de: DE };
