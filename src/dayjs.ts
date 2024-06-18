import dayjs from 'dayjs';
// @ts-ignore
import utc from 'dayjs-plugin-utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// dayjs.tz.setDefault('Europe/Bucharest');

export default dayjs;
