import { struct } from 'superstruct'

const _Ingang = struct.interface({
  idx: 'number',
  grade: 'number',
  klass: 'number',
  day: 'string',
  time: 'string',
  count: 'number',
  max: 'number',
  applyStartDate: 'string',
  applyEndDate: 'string',
  weekApplyCount: 'number',
  applied: 'boolean'
})

export const Ingang = ingang => _Ingang({
  idx: ingang['idx'],
  grade: ingang['target_grade'],
  klass: ingang['klass'],
  day: ingang['day'],
  time: ingang['time'],
  count: ingang['count'],
  max: ingang['max'],
  applyStartDate: ingang['apply_start_date'],
  applyEndDate: ingang['apply_end_date'],
  weekApplyCount: ingang['week_apply_count'],
  applied: ingang['applied']
})
