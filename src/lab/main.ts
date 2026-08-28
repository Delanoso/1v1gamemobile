import './lab.css'
import { LabApp } from './LabApp'

const root = document.querySelector<HTMLDivElement>('#lab-root')
if (!root) throw new Error('#lab-root missing')

new LabApp(root)
