import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import './story.css'
import StoryApp from './StoryApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoryApp />
  </StrictMode>,
)
