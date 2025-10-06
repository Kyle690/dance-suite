import 'dayjs/locale/en-gb'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customerParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import quarter from 'dayjs/plugin/quarterOfYear'
import en from 'dayjs/locale/en-gb'

dayjs.locale(en)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Europe/London')
dayjs.extend(customerParseFormat)
dayjs.extend(isBetween)
dayjs.extend(quarter)

export default dayjs
