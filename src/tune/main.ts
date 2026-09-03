import { ViewmodelTuneApp } from './ViewmodelTuneApp'

const root = document.querySelector<HTMLDivElement>('#tune-root')
if (!root) throw new Error('#tune-root missing')

new ViewmodelTuneApp(root)
