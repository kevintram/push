import dayjs from 'dayjs'

export function localDateString(date?: Date): string {
	return dayjs(date).format('YYYY-MM-DD')
}
