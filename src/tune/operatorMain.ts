import { OperatorTuneApp } from './OperatorTuneApp'

const root = document.querySelector<HTMLDivElement>('#operator-tune-root')
if (!root) throw new Error('#operator-tune-root missing')

new OperatorTuneApp(root)
