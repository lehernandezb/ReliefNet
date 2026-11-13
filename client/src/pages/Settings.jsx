import { useState } from 'react'
import Page, { Section } from '../components/Page'
import { useAuth } from '../context/AuthContext'
import { getTheme, setTheme, THEMES } from '../theme'

export default function Settings() {
  const { user } = useAuth()
  const [theme, setCurrent] = useState(getTheme)

  function choose(value) {
    setTheme(value)
    setCurrent(value)
  }

  return (
    <Page title="Settings" sub={`Signed in as ${user.name} (${user.role})`}>
      <Section title="Appearance" note="Your choice is saved in this browser.">
        <fieldset className="card">
          <legend className="sr-only">Colour mode</legend>
          <div className="options">
            {THEMES.map(([value, label, hint]) => (
              <label key={value} className="option">
                <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => choose(value)} />
                <span className="grow"><strong>{label}</strong> <span className="muted">{hint}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>
    </Page>
  )
}
