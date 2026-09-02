import { ViewmodelTuneApp } from './ViewmodelTuneApp'

const params = new URLSearchParams(window.location.search)
if (!params.has('mode')) params.set('mode', 'operator')
window.location.replace(`/tune.html?${params.toString()}`)

// Satisfy bundler if redirect is blocked
void ViewmodelTuneApp
